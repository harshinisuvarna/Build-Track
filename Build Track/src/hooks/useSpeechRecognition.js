import { useState, useRef, useEffect, useCallback } from 'react';

// ---------------------------------------------------------------------------
// useSpeechRecognition — Port of Flutter VoiceRecordingController
//
// Features matching Flutter:
//   • Pre-initialization: starts STT engine immediately on mount (idle state)
//   • Continuous recording with auto-restart on silence/end-of-speech
//   • Accumulated transcript (final + interim concatenated)
//   • Sound level monitoring via Web Audio API (AnalyserNode)
//   • Processing timeout (60s)
//   • Reset engine capability
//   • Session timer (elapsed seconds)
// ---------------------------------------------------------------------------

const PROCESSING_TIMEOUT_MS = 60_000;

export default function useSpeechRecognition() {
  // --- State ---
  const [interimTranscript, setInterimTranscript] = useState('');
  const [accumulatedTranscript, setAccumulatedTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEngineReady, setIsEngineReady] = useState(false);
  const [error, setError] = useState(null);
  const [soundLevel, setSoundLevel] = useState(0.0);
  const [sessionElapsed, setSessionElapsed] = useState(0);

  // --- Refs ---
  const recognitionRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const timerRef = useRef(null);
  const processingTimerRef = useRef(null);
  const restartCountRef = useRef(0);
  const isStartingRef = useRef(false);
  const accumulatedRef = useRef('');

  // --- Helpers ---
  const hasSpeechRecognition = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const SpeechRecognitionCtor = hasSpeechRecognition
    ? (window.SpeechRecognition || window.webkitSpeechRecognition)
    : null;

  // Sync accumulatedRef with state
  useEffect(() => {
    accumulatedRef.current = accumulatedTranscript;
  }, [accumulatedTranscript]);

  // --- Session timer ---
  const startTimer = useCallback(() => {
    if (timerRef.current) return;
    setSessionElapsed(0);
    timerRef.current = setInterval(() => {
      setSessionElapsed(prev => prev + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // --- Sound level monitoring (Web Audio API) ---
  const startSoundLevelMonitoring = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;
      source.connect(analyserRef.current);

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

      const updateLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = sum / dataArray.length;
        const normalized = Math.min(1.0, avg / 128.0);
        setSoundLevel(normalized);
        animFrameRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();
    } catch {
      // Microphone access denied or unavailable — degrade gracefully
    }
  }, []);

  const stopSoundLevelMonitoring = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setSoundLevel(0);
  }, []);

  // --- Pre-init STT engine (idle listening) ---
  const preInitEngine = useCallback(() => {
    if (!SpeechRecognitionCtor) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }
    if (recognitionRef.current) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsEngineReady(true);
      isStartingRef.current = false;
    };

    recognition.onresult = (event) => {
      let interim = '';
      let finalSegment = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalSegment += transcript;
        } else {
          interim += transcript;
        }
      }

      if (finalSegment) {
        setAccumulatedTranscript(prev => {
          const next = prev ? prev + ' ' + finalSegment.trim() : finalSegment.trim();
          accumulatedRef.current = next;
          return next;
        });
        setInterimTranscript('');
      } else if (interim) {
        setInterimTranscript(interim);
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'no-speech') {
        // Silently restart — this is normal
        return;
      }
      if (event.error === 'aborted') {
        return;
      }
      console.error('Speech recognition error:', event.error);
      setError(`Speech recognition error: ${event.error}`);
    };

    recognition.onend = () => {
      // Auto-restart if we're still in recording state
      if (isRecording && restartCountRef.current < 50) {
        restartCountRef.current += 1;
        try {
          recognition.start();
        } catch {
          // Already started
        }
      }
    };

    recognitionRef.current = recognition;

    // Start in idle mode (paused)
    try {
      recognition.start();
      recognition.stop();
    } catch {
      // Ignore — we just want the engine loaded
    }
  }, [SpeechRecognitionCtor, isRecording]);

  // --- Start actual recording ---
  const startRecording = useCallback(() => {
    if (!recognitionRef.current) {
      preInitEngine();
    }
    const recognition = recognitionRef.current;
    if (!recognition) return;

    setError(null);
    restartCountRef.current = 0;
    isStartingRef.current = true;

    try {
      recognition.start();
      setIsRecording(true);
      startTimer();
      startSoundLevelMonitoring();
    } catch {
      // May already be started — try stop then start
      try {
        recognition.stop();
        setTimeout(() => {
          try {
            recognition.start();
            setIsRecording(true);
            startTimer();
            startSoundLevelMonitoring();
          } catch {
            setError('Failed to start speech recognition.');
          }
        }, 100);
      } catch {
        setError('Failed to start speech recognition.');
      }
    }
  }, [preInitEngine, startTimer, startSoundLevelMonitoring]);

  // --- Stop recording ---
  const stopRecording = useCallback(() => {
    setIsRecording(false);
    stopTimer();
    stopSoundLevelMonitoring();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
  }, [stopTimer, stopSoundLevelMonitoring]);

  // --- Reset transcript ---
  const resetTranscript = useCallback(() => {
    setAccumulatedTranscript('');
    setInterimTranscript('');
    accumulatedRef.current = '';
  }, []);

  // --- Reset engine (destroy and recreate) ---
  const resetEngine = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }
    stopSoundLevelMonitoring();
    setIsEngineReady(false);
    isStartingRef.current = false;
    restartCountRef.current = 0;
  }, [stopSoundLevelMonitoring]);

  // --- Full reset (for new entry cycle) ---
  const resetAll = useCallback(() => {
    resetTranscript();
    resetEngine();
    setIsProcessing(false);
    setError(null);
    setSessionElapsed(0);
    setSoundLevel(0);
    if (processingTimerRef.current) {
      clearTimeout(processingTimerRef.current);
      processingTimerRef.current = null;
    }
  }, [resetTranscript, resetEngine]);

  // --- Set processing state with timeout ---
  const setProcessing = useCallback((val) => {
    setIsProcessing(val);
    if (val) {
      processingTimerRef.current = setTimeout(() => {
        setIsProcessing(false);
        setError('Processing timed out. Please try again.');
      }, PROCESSING_TIMEOUT_MS);
    } else {
      if (processingTimerRef.current) {
        clearTimeout(processingTimerRef.current);
        processingTimerRef.current = null;
      }
    }
  }, []);

  // --- Pre-init on mount ---
  useEffect(() => {
    preInitEngine();
    return () => {
      resetAll();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    // State
    interimTranscript,
    accumulatedTranscript,
    fullTranscript: accumulatedRef.current || accumulatedTranscript,
    isRecording,
    isProcessing,
    isEngineReady,
    error,
    soundLevel,
    sessionElapsed,
    hasSpeechRecognition,

    // Actions
    startRecording,
    stopRecording,
    resetTranscript,
    resetEngine,
    resetAll,
    setProcessing,
    setAccumulatedTranscript,
  };
}
