import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function AdminRoute({ children }) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-muted)' }}>
        Verifying permissions...
      </div>
    );
  }

  if (!isAuthenticated || !user || !user.isAdmin) {
    return (
      <div className="container" style={{ maxWidth: '540px', paddingTop: '6rem', paddingBottom: '6rem', textAlign: 'center' }}>
        <div className="glass-panel" style={{ padding: '2.5rem' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'var(--accent-red-bg)',
            color: 'var(--accent-red)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem auto'
          }}>
            <ShieldAlert size={28} />
          </div>

          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Access Denied</h2>
          
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '2rem' }}>
            The Database Analytics Lab is restricted to system administrators. Standard users do not have access to database switching, execution plans, or benchmarking controls.
          </p>

          <Link to="/feed" className="btn btn-primary" style={{ padding: '0.75rem 1.75rem' }}>
            <ArrowLeft size={16} />
            <span>Return to Social Feed</span>
          </Link>
        </div>
      </div>
    );
  }

  return children;
}
