import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

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
        Authenticating session...
      </div>
    );
  }

  if (!isAuthenticated) {
    // Session destroyed / not logged in: kick directly to /login
    return <Navigate to="/login" replace />;
  }

  return children;
}
