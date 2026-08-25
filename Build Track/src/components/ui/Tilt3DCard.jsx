import React, { useState, useRef, useCallback } from 'react';

export default function Tilt3DCard({
  children,
  className = '',
  style = {},
  maxTilt = 8, // max degree tilt
  scale = 1.02,
  perspective = 1000,
  glare = true,
  onClick,
  ...props
}) {
  const [tiltStyle, setTiltStyle] = useState({
    transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
    transition: 'transform 400ms cubic-bezier(0.03, 0.98, 0.52, 0.99), box-shadow 400ms ease',
  });
  
  const [glareStyle, setGlareStyle] = useState({
    opacity: 0,
    background: 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0) 80%)',
  });

  const cardRef = useRef(null);

  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width;
    const yPct = mouseY / height;

    const rotateX = ((0.5 - yPct) * (maxTilt * 2)).toFixed(2);
    const rotateY = ((xPct - 0.5) * (maxTilt * 2)).toFixed(2);

    setTiltStyle({
      transform: `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${scale}, ${scale}, ${scale})`,
      transition: 'transform 100ms ease-out, box-shadow 200ms ease',
    });

    if (glare) {
      setGlareStyle({
        opacity: 0.35,
        background: `radial-gradient(circle at ${xPct * 100}% ${yPct * 100}%, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0) 70%)`,
      });
    }
  }, [maxTilt, scale, perspective, glare]);

  const handleMouseLeave = useCallback(() => {
    setTiltStyle({
      transform: `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`,
      transition: 'transform 500ms cubic-bezier(0.03, 0.98, 0.52, 0.99), box-shadow 500ms ease',
    });
    if (glare) {
      setGlareStyle((prev) => ({
        ...prev,
        opacity: 0,
      }));
    }
  }, [perspective, glare]);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={`tilt-3d-wrapper ${className}`}
      style={{
        position: 'relative',
        transformStyle: 'preserve-3d',
        willChange: 'transform',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
        ...tiltStyle,
      }}
      {...props}
    >
      {children}
      {glare && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            pointerEvents: 'none',
            zIndex: 10,
            transition: 'opacity 300ms ease',
            ...glareStyle,
          }}
        />
      )}
    </div>
  );
}
