import React, { useEffect, useState } from 'react';
import { Joyride, STATUS } from 'react-joyride';
import { useAuth } from '../contexts/AuthContext';
import useProjectStore from '../stores/projectStore';
import { API_ORIGIN } from '../api';

const AppTour = () => {
  const { user, updateUser } = useAuth();
  const { projects, projectsLoaded } = useProjectStore();
  const [run, setRun] = useState(false);

  const [dynamicSteps, setDynamicSteps] = useState([]);

  useEffect(() => {
    if (!user || !projectsLoaded) return;
    
    // Default values if user doesn't have the onboarding object yet
    const onboarding = user.onboarding || {};
    const hasSkippedTour = !!onboarding.hasSkippedTour;

    const buildSteps = (isReplay = false) => {
      const steps = [
        {
          target: 'body',
          content: 'Welcome to BuildTrack! Let us show you around so you can get started quickly.',
          placement: 'center',
          disableBeacon: true,
        }
      ];

      steps.push({
        target: '.tour-projects',
        content: 'Click here to view or create projects. Projects help you track everything in one place.',
      });

      steps.push({
        target: '.tour-add-entry',
        content: 'Once you have a project, you can add an entry like material usage or expense here.',
      });

      steps.push({
        target: '.tour-voice',
        content: 'Use Voice AI to quickly log updates without typing.',
      });

      steps.push({
        target: '.tour-log',
        content: 'Check your transaction logs here.',
      });

      steps.push({
        target: '.tour-inventory',
        content: 'Manage your material inventory efficiently here.',
      });

      steps.push({
        target: '.tour-reports',
        content: 'Check out the reports section to see financial summaries and project stats.',
      });

      steps.push({
        target: '.tour-subscription',
        content: 'Manage your plan and billing details here.',
      });

      return steps;
    };

    // Auto-start logic ONLY for brand new users with 0 projects
    if (!hasSkippedTour && projects.length === 0) {
      const stepsForUser = buildSteps(false);
      if (stepsForUser.length > 1) {
        setDynamicSteps(stepsForUser);
        setRun(true);
      }
    }
    
    // Listen for manual trigger from sidebar
    const handleReplay = () => {
      setDynamicSteps(buildSteps(true));
      setRun(true);
    };
    
    window.addEventListener('replay-app-tour', handleReplay);
    return () => window.removeEventListener('replay-app-tour', handleReplay);
  }, [user, projects.length, projectsLoaded]);

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
      key={run ? 'running' : 'stopped'}
      callback={handleJoyrideCallback}
      continuous
      hideCloseButton
      run={run}
      scrollToFirstStep
      showProgress
      showSkipButton
      steps={dynamicSteps}
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
