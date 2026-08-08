import React from 'react';
import Joyride, { STATUS } from 'react-joyride';
import { useAuth } from '../contexts/AuthContext';
import { userAPI } from '../api';

export default function ModuleTour({ steps, run, setRun, moduleName }) {
  const { user, updateUser } = useAuth();

  const handleJoyrideCallback = async (data) => {
    const { status } = data;
    const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      try {
        await userAPI.visitModule({ moduleName });
        const visitedModules = user?.onboarding?.visitedModules || [];
        if (!visitedModules.includes(moduleName)) {
          updateUser({
            onboarding: {
              ...user?.onboarding,
              visitedModules: [...visitedModules, moduleName]
            }
          });
        }
      } catch (err) {
        console.error("Failed to record module visit", err);
      }
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#0066cc',
          zIndex: 10000,
        },
      }}
    />
  );
}
