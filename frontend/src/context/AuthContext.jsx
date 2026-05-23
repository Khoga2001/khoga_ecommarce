import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('khoga_user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Verify token on mount
  useEffect(() => {
    const token = localStorage.getItem('khoga_token');
    if (token) {
      authApi.getMe()
        .then(res => {
          setUser(res.data);
          localStorage.setItem('khoga_user', JSON.stringify(res.data));
        })
        .catch(() => {
          localStorage.removeItem('khoga_token');
          localStorage.removeItem('khoga_user');
          setUser(null);
        })
        .finally(() => setInitialized(true));
    } else {
      setInitialized(true);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      const { access_token, user: userData } = res.data;
      localStorage.setItem('khoga_token', access_token);
      localStorage.setItem('khoga_user', JSON.stringify(userData));
      setUser(userData);
      return { success: true, user: userData };
    } catch (err) {
      return { success: false, error: err.response?.data?.detail || 'Login failed' };
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (name, email, password, phone) => {
    setLoading(true);
    try {
      const res = await authApi.register({ name, email, password, phone });
      const { access_token, user: userData } = res.data;
      localStorage.setItem('khoga_token', access_token);
      localStorage.setItem('khoga_user', JSON.stringify(userData));
      setUser(userData);
      return { success: true, user: userData };
    } catch (err) {
      return { success: false, error: err.response?.data?.detail || 'Registration failed' };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('khoga_token');
    localStorage.removeItem('khoga_user');
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('khoga_user', JSON.stringify(updatedUser));
  }, []);

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{
      user, loading, initialized, isAdmin,
      login, register, logout, updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
