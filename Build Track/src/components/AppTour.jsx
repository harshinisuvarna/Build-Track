import React, { useEffect, useState } from 'react';
import { Joyride, STATUS } from 'react-joyride';
import { useAuth } from '../contexts/AuthContext';
import { API_ORIGIN, projectAPI, transactionAPI } from '../api';

const AppTour = () => {
  const { user, updateUser } = useAuth();
  const [run, setRun] = useState(false);

  const [dynamicSteps, setDynamicSteps] = useState([]);

  useEffect(() => {
    if (!user) return;
    
    // Default values if user doesn't have the onboarding object yet
    const onboarding = user.onboarding || {};
    const hasSkippedTour = !!onboarding.hasSkippedTour;
    const hasCreatedProject = !!onboarding.hasCreatedProject;
    const hasAddedEntry = !!onboarding.hasAddedEntry;
    const hasViewedReports = !!onboarding.hasViewedReports;
    const hasUsedBulkCSV = !!onboarding.hasUsedBulkCSV;

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
        target: '.tour-dashboard',
        content: 'This is your Dashboard. Get a quick overview of your projects and recent activity here.',
      });

      if (isReplay || !hasCreatedProject) {
        steps.push({
          target: '.tour-create-project',
          content: 'Click here to create your first project. Projects help you track everything in one place.',
        });
      }

      if (isReplay || !hasAddedEntry) {
        steps.push({
          target: '.tour-add-entry',
          content: 'Once you have a project, you can add an entry like material usage or expense here.',
        });
      }

      steps.push({
        target: '.tour-voice',
        content: 'Use the AI Foreman to quickly log updates using your voice.',
      });
      
      steps.push({
        target: '.tour-log',
        content: 'View all your recent entries and transactions here.',
      });
      
      steps.push({
        target: '.tour-inventory',
        content: 'Manage your materials and stock levels efficiently.',
      });

      if (isReplay || !hasViewedReports) {
        steps.push({
          target: '.tour-reports',
          content: 'Check out the reports section to see financial summaries and project stats.',
        });
      }

      steps.push({
        target: '.tour-subscription',
        content: 'Manage your plan, team size, and billing from the Subscription page.',
      });
      
      steps.push({
        target: '.tour-settings',
        content: 'Configure your profile and app preferences here.',
      });

      return steps;
    };

    // Auto-start logic
    if (!hasSkippedTour) {
      Promise.all([
        projectAPI.getAll().catch(() => ({ data: [] })),
        transactionAPI.getAll().catch(() => ({ data: [] }))
      ]).then(([projRes, transRes]) => {
        const projects = Array.isArray(projRes.data) ? projRes.data : projRes.data?.data || [];
        const transactions = Array.isArray(transRes.data) ? transRes.data : transRes.data?.transactions || transRes.data?.data || [];
        
        if (projects.length === 0 && transactions.length === 0) {
          const stepsForUser = buildSteps(false);
          if (stepsForUser.length > 0) {
            setDynamicSteps(stepsForUser);
            setRun(true);
          }
        }
      });
    }
    
    // Listen for manual trigger from sidebar
    const handleReplay = () => {
      setDynamicSteps(buildSteps(true));
      setRun(true);
    };
    
    window.addEventListener('replay-app-tour', handleReplay);
    return () => window.removeEventListener('replay-app-tour', handleReplay);
  }, [user]);

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
