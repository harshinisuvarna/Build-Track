import { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [toast, setToast] = useState({ message: '', type: 'info', key: 0 });

  const showToast = useCallback((message, type = 'info') => {
    setToast((prev) => ({ message, type, key: prev.key + 1 }));
  }, []);

  const clearToast = useCallback(() => {
    setToast((prev) => ({ ...prev, message: '' }));
  }, []);

  const value = { toast, showToast, clearToast };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider');
  return ctx;
}

export default NotificationContext;
