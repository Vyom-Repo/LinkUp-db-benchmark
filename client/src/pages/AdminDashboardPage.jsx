import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboardPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <h1 style={{
        fontSize: '2.5rem',
        fontWeight: 700,
        color: 'var(--text-primary)',
        margin: 0,
        textTransform: 'lowercase'
      }}>
        dashboard
      </h1>

      <button
        onClick={handleLogout}
        className="btn btn-secondary"
        style={{
          marginTop: '1.5rem',
          padding: '0.45rem 1rem',
          fontSize: '0.85rem',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          cursor: 'pointer'
        }}
      >
        <LogOut size={14} />
        <span>Logout</span>
      </button>
    </div>
  );
}
