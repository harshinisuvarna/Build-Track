import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import useProjectStore from '../stores/projectStore';
import { Modal, Button } from './ui';
import { HelpCircle } from 'lucide-react';

export default function WelcomeModal() {
  const { user, updateUser, loading } = useAuth();
  const { projects, projectsLoaded } = useProjectStore();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!loading && user && user.onboarding && projectsLoaded) {
      const isNewUser = projects.length === 0;
      if (isNewUser && user.onboarding.visitedModules && user.onboarding.visitedModules.length === 0) {
        setOpen(true);
      }
    }
  }, [user, loading, projects.length]);

  const handleClose = () => {
    setOpen(false);
    // Optionally we could dispatch an event here to trigger the dashboard tour
    window.dispatchEvent(new Event('trigger-dashboard-tour'));
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={handleClose} title="Welcome to BuildTrack!">
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <HelpCircle size={48} color="#0066cc" style={{ margin: '0 auto 16px' }} />
        <h3 style={{ marginBottom: 12 }}>Welcome!</h3>
        <p style={{ color: '#666', lineHeight: 1.5, marginBottom: 24 }}>
          You will find a Help (?) button on every page. Click it whenever you need a step-by-step guide.
        </p>
        <Button variant="primary" onClick={handleClose}>
          Get Started
        </Button>
      </div>
    </Modal>
  );
}
