import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('bt_user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('bt_token'));
  const [loading, setLoading] = useState(() => {
    const storedToken = localStorage.getItem('bt_token');
    const storedUser = localStorage.getItem('bt_user');
    return !!(storedToken && !storedUser);
  });

  useEffect(() => {
    const storedToken = localStorage.getItem('bt_token');
    if (storedToken) {
      authAPI.me()
        .then((res) => {
          const userData = res.data?.user || res.data;
          setUser(userData);
          localStorage.setItem('bt_user', JSON.stringify(userData));
        })
        .catch(() => {
          localStorage.removeItem('bt_token');
          localStorage.removeItem('bt_user');
          setToken(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authAPI.login({ email, password });
    const data = res.data;
    const t = data.token || data.accessToken;
    const u = data.user || data;
    localStorage.setItem('bt_token', t);
    localStorage.setItem('bt_user', JSON.stringify(u));
    setToken(t);
    setUser(u);
    window.dispatchEvent(new Event('userUpdated'));
    return u;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const res = await authAPI.register({ name, email, password });
    const data = res.data;
    const t = data.token || data.accessToken;
    const u = data.user || data;
    localStorage.setItem('bt_token', t);
    localStorage.setItem('bt_user', JSON.stringify(u));
    setToken(t);
    setUser(u);
    window.dispatchEvent(new Event('userUpdated'));
    return u;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('bt_token');
    localStorage.removeItem('bt_user');
    setToken(null);
    setUser(null);
    window.dispatchEvent(new Event('userUpdated'));
  }, []);

  const updateUser = useCallback((updates) => {
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem('bt_user', JSON.stringify(updated));
    window.dispatchEvent(new Event('userUpdated'));
  }, [user]);

  const isAuthenticated = !!token;
  const isAdmin = user?.role?.toLowerCase() === 'admin';
  const can = useCallback((permission) => {
    const r = user?.role?.toLowerCase();
    if (r === 'admin' || r === 'supervisor') return true;
    const perms = user?.permissions || [];
    return perms.includes(permission);
  }, [user]);

  const value = {
    user, token, loading,
    isAuthenticated, isAdmin, can,
    login, register, logout, updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
