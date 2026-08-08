import React, { useEffect, useState } from 'react';
import { Joyride, STATUS } from 'react-joyride';
import { useAuth } from '../contexts/AuthContext';
import { API_ORIGIN } from '../api';

const AppTour = () => {
  const { user, updateUser } = useAuth();
  const [run, setRun] = useState(false);

  useEffect(() => {
    // Only auto-start if onboarding state matches
    if (user && user.onboarding) {
      const { hasSkippedTour, hasCreatedProject, hasAddedEntry } = user.onboarding;
      if (!hasSkippedTour && !hasCreatedProject && !hasAddedEntry) {
        setRun(true);
      }
    }
    
    // Listen for manual trigger from sidebar
    const handleReplay = () => setRun(true);
    window.addEventListener('replay-app-tour', handleReplay);
    return () => window.removeEventListener('replay-app-tour', handleReplay);
  }, [user]);

  const steps = [
    {
      target: 'body',
      content: 'Welcome to BuildTrack! Let us show you around so you can get started quickly.',
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '.tour-create-project',
      content: 'Click here to create your first project. Projects help you track everything in one place.',
    },
    {
      target: '.tour-add-entry',
      content: 'Once you have a project, you can add an entry like material usage or expense here.',
    },
    {
      target: '.tour-reports',
      content: 'Check out the reports section to see financial summaries and project stats.',
    },
    {
      target: '.tour-bulk-csv',
      content: 'If you have a lot of data, you can bulk upload entries using a CSV file from the manual entry page.',
    }
  ];

  const handleJoyrideCallback = async (data) => {
    const { status, action } = data;
    const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];
    
    if (finishedStatuses.includes(status) || action === 'close') {
      setRun(false);
      try {
        const token = localStorage.getItem('bt_token') || localStorage.getItem('token');
        const res = await fetch(`${API_ORIGIN}/api/users/onboarding/skip`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        const json = await res.json();
        if (json.user && updateUser) {
          updateUser(json.user);
        }
      } catch (err) {
        console.error('Failed to skip onboarding', err);
      }
    }
  };

  if (!user) return null;

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous
      hideCloseButton
      run={run}
      scrollToFirstStep
      showProgress
      showSkipButton
      steps={steps}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: '#5B5CEB',
        },
      }}
    />
  );
};

export default AppTour;
