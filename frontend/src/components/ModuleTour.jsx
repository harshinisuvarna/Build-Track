import React from 'react';
import Joyride, { STATUS } from 'react-joyride';
import { useAuth } from '../contexts/AuthContext';
import { userAPI } from '../api';

export default function ModuleTour({ steps, run, setRun, moduleName }) {
  const { user, updateUser } = useAuth();

  const endTour = () => {
    setRun(false);
    userAPI.visitModule({ moduleName })
      .catch((err) => console.error("Failed to record module visit", err));

    const visitedModules = user?.onboarding?.visitedModules || [];
    if (!visitedModules.includes(moduleName)) {
      updateUser({
        onboarding: {
          ...user?.onboarding,
          visitedModules: [...visitedModules, moduleName]
        }
      });
    }
  };

  const handleJoyrideCallback = (data) => {
    console.log("Joyride Callback Data:", data);
    const { status, action, type } = data;
    const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status) || action === 'close' || action === 'skip') {
      endTour();
    }
  };

  return (
    <>
      {run && steps.length > 0 && (
        <button
          onClick={endTour}
          style={{
            position: 'fixed',
            right: 20,
            bottom: 20,
            zIndex: 10050,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 16px',
            borderRadius: 12,
            border: 'none',
            background: '#DC2626',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
            cursor: 'pointer',
            boxShadow: '0 8px 20px -4px rgba(220, 38, 38, 0.45)',
          }}
        >
          ✕ Skip Tour
        </button>
      )}
      <Joyride
        steps={steps.map(s => ({ ...s, disableBeacon: true }))}
        run={run}
        continuous={true}
        showProgress={true}
        showSkipButton={true}
        locale={{ skip: 'Skip', next: 'Next', back: 'Back', last: 'Finish' }}
        callback={handleJoyrideCallback}
        styles={{ options: {
            primaryColor: '#0066cc',
            zIndex: 10000,
            } }}
      />
    </>
  );
}