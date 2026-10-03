import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('sync_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (data.success) {
          setUser(data.data.user);
        } else {
          logout();
        }
      } catch (err) {
        console.error('Failed to load user session:', err);
        logout();
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [token]);

  const register = async (userData) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || 'Registration failed.');
    }

    setUser(data.data.user);
    setToken(data.data.token);
    localStorage.setItem('sync_token', data.data.token);
    return data.data.user;
  };

  const login = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || 'Login failed.');
    }

    setUser(data.data.user);
    setToken(data.data.token);
    localStorage.setItem('sync_token', data.data.token);
    return data.data.user;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('sync_token');
  };

  const updateUser = (updatedFields) => {
    setUser((prev) => (prev ? { ...prev, ...updatedFields } : prev));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        register,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
