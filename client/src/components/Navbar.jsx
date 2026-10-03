import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, LogOut, Radio } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isCurrent = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backgroundColor: 'rgba(248, 246, 240, 0.92)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-color)',
      padding: '0.85rem 0'
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        
        {/* Brand with AI Monogram Logo */}
        <Link 
          to={isAuthenticated ? "/feed" : "/"} 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.65rem', 
            textDecoration: 'none',
            color: 'inherit'
          }}
        >
          <img 
            src="/logo.jpg" 
            alt="Sync Logo" 
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '9px',
              objectFit: 'cover',
              boxShadow: '0 2px 8px rgba(44, 39, 32, 0.08)'
            }} 
          />
          <span style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
            Sync
          </span>
        </Link>

        {/* Right Section: Auth State Dependent */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              
              {/* Feed Navigation Link */}
              <Link
                to="/feed"
                className="btn btn-secondary"
                style={{
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.825rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isCurrent('/feed') ? 'var(--primary-light)' : '#FFFFFF',
                  borderColor: isCurrent('/feed') ? 'var(--primary)' : 'var(--border-color)',
                  color: isCurrent('/feed') ? 'var(--primary)' : 'var(--text-primary)',
                  fontWeight: 600,
                }}
              >
                <Radio size={14} />
                <span>Feed</span>
              </Link>

              {/* Student Profile Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <img 
                  src={user?.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.username || 'user'}`} 
                  alt={user?.name || 'User'} 
                  style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-color)' }}
                />
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {user?.name}
                </span>
              </div>

              {/* Complete Session Destruction Logout */}
              <button
                onClick={handleLogout}
                className="btn btn-secondary"
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.825rem', borderRadius: 'var(--radius-md)' }}
                title="Destroy session and log out"
              >
                <LogOut size={14} />
                <span>Log out</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Link 
                to="/login"
                className="btn btn-secondary" 
                style={{ 
                  padding: '0.5rem 1.15rem', 
                  fontSize: '0.875rem', 
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isCurrent('/login') ? 'var(--primary-light)' : '#FFFFFF',
                  borderColor: isCurrent('/login') ? 'var(--primary)' : 'var(--border-color)',
                  color: isCurrent('/login') ? 'var(--primary)' : 'var(--text-primary)',
                }}
              >
                <LogIn size={15} />
                <span>Log in</span>
              </Link>

              <Link 
                to="/register"
                className="btn btn-primary" 
                style={{ 
                  padding: '0.5rem 1.15rem', 
                  fontSize: '0.875rem', 
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isCurrent('/register') ? 'var(--primary)' : 'var(--text-primary)',
                }}
              >
                <UserPlus size={15} />
                <span>Register</span>
              </Link>
            </div>
          )}
        </div>

      </div>
    </nav>
  );
}
