import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminRoute({ children }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '60vh',
        color: 'var(--text-muted)',
        fontSize: '0.95rem'
      }}>
        Verifying administrator authorization...
      </div>
    );
  }

  // Not logged in -> kick to /admin/login
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  // Logged in as regular user -> kick to /feed without exposing admin controls
  if (!user?.isAdmin) {
    return <Navigate to="/feed" replace />;
  }

  return children;
}
