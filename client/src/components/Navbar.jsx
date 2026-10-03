import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Radio, 
  Search, 
  Cpu, 
  LogOut, 
  LogIn, 
  UserPlus
} from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  const isFrontPage = location.pathname === '/';
  const isCurrent = (path) => location.pathname === path;

  return (
    <nav style={{ 
      position: 'sticky', 
      top: 0, 
      zIndex: 100, 
      backgroundColor: 'rgba(251, 249, 245, 0.94)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-color)',
      padding: '0.75rem 0'
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        
        {/* Brand with AI Generated Logo */}
        <Link to="/" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.65rem', 
          textDecoration: 'none',
          color: 'inherit'
        }}>
          <img 
            src="/logo.jpg" 
            alt="Sync Brand Logo" 
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              objectFit: 'cover',
              boxShadow: '0 2px 8px rgba(44, 39, 32, 0.08)'
            }} 
          />
          <span style={{ fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
            Sync
          </span>
        </Link>

        {/* Center: Contextual App Navigation (HIDDEN on Front Page) */}
        {!isFrontPage && isAuthenticated && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Link 
              to="/feed" 
              className="btn btn-secondary" 
              style={{ 
                padding: '0.45rem 0.85rem',
                backgroundColor: isCurrent('/feed') ? 'var(--primary)' : 'transparent',
                borderColor: isCurrent('/feed') ? 'var(--primary)' : 'transparent',
                color: isCurrent('/feed') ? '#FFFFFF' : 'var(--text-secondary)',
                boxShadow: isCurrent('/feed') ? '0 2px 8px var(--primary-glow)' : 'none'
              }}
            >
              <Radio size={15} />
              <span>Feed</span>
            </Link>

            <Link 
              to="/search" 
              className="btn btn-secondary" 
              style={{ 
                padding: '0.45rem 0.85rem',
                backgroundColor: isCurrent('/search') ? 'var(--primary)' : 'transparent',
                borderColor: isCurrent('/search') ? 'var(--primary)' : 'transparent',
                color: isCurrent('/search') ? '#FFFFFF' : 'var(--text-secondary)',
                boxShadow: isCurrent('/search') ? '0 2px 8px var(--primary-glow)' : 'none'
              }}
            >
              <Search size={15} />
              <span>Search</span>
            </Link>

            {user && user.isAdmin && (
              <Link 
                to="/admin" 
                className="btn btn-secondary" 
                style={{ 
                  padding: '0.45rem 0.85rem',
                  backgroundColor: isCurrent('/admin') ? 'var(--primary)' : 'transparent',
                  borderColor: isCurrent('/admin') ? 'var(--primary)' : 'transparent',
                  color: isCurrent('/admin') ? '#FFFFFF' : 'var(--text-secondary)',
                  fontWeight: 600,
                  boxShadow: isCurrent('/admin') ? '0 2px 8px var(--primary-glow)' : 'none'
                }}
              >
                <Cpu size={15} />
                <span>Admin Lab</span>
              </Link>
            )}
          </div>
        )}

        {/* Right Section: ONLY Login and Register on Front Page */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Link 
                to={`/profile/${user.username}`} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  textDecoration: 'none',
                  color: 'var(--text-primary)'
                }}
              >
                <img 
                  src={user.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.username}`} 
                  alt={user.username}
                  style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-color)' }}
                />
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user.name}</span>
              </Link>

              <button 
                onClick={logout} 
                className="btn btn-secondary" 
                style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                title="Log out"
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
                style={{ padding: '0.5rem 1.15rem', fontSize: '0.875rem' }}
              >
                <LogIn size={15} />
                <span>Log in</span>
              </Link>
              <Link 
                to="/register" 
                className="btn btn-primary" 
                style={{ padding: '0.5rem 1.15rem', fontSize: '0.875rem' }}
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
