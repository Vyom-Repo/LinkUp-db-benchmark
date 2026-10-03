import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('sync_token') || null);
  const [loading, setLoading] = useState(true);

  // Initialize and verify user on mount
  useEffect(() => {
    const verifyUser = async () => {
      const storedToken = localStorage.getItem('sync_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/auth/me');
        if (res.data.success) {
          setUser(res.data.data.user);
        }
      } catch (err) {
        console.warn('Failed to verify token:', err.message);
        localStorage.removeItem('sync_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifyUser();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      const { user: userData, token: jwtToken } = res.data.data;
      localStorage.setItem('sync_token', jwtToken);
      setToken(jwtToken);
      setUser(userData);
      return userData;
    }
  };

  const register = async (payload) => {
    const res = await api.post('/auth/register', payload);
    if (res.data.success) {
      const { user: userData, token: jwtToken } = res.data.data;
      localStorage.setItem('sync_token', jwtToken);
      setToken(jwtToken);
      setUser(userData);
      return userData;
    }
  };

  const logout = () => {
    localStorage.removeItem('sync_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        isAdmin: !!(user && user.isAdmin),
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
