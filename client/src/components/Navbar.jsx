import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDatabase } from '../context/DatabaseContext';
import { 
  Radio, 
  Search, 
  Cpu, 
  LogOut, 
  LogIn, 
  UserPlus, 
  Database
} from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { activeEngine, lastLatencyMs, switchEngine, switching } = useDatabase();
  const location = useLocation();

  const isCurrent = (path) => location.pathname === path;

  return (
    <nav style={{ 
      position: 'sticky', 
      top: 0, 
      zIndex: 100, 
      backgroundColor: 'rgba(251, 249, 245, 0.92)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-color)',
      padding: '0.65rem 0'
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        
        {/* Brand with AI Generated Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
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
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                objectFit: 'cover',
                boxShadow: '0 2px 8px rgba(44, 39, 32, 0.08)'
              }} 
            />
            <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
              Sync
            </span>
          </Link>

          {/* Navigation Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
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
          </div>
        </div>

        {/* Right Section: Engine Pill & Auth */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          
          {/* Active Database Engine Badge & Switcher */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.4rem',
            background: '#FFFFFF',
            padding: '0.2rem 0.45rem',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <button
              onClick={() => switchEngine(activeEngine === 'postgres' ? 'mongodb' : 'postgres')}
              disabled={switching}
              title="Click to toggle active database engine globally"
              className={activeEngine === 'postgres' ? 'badge-engine-postgres' : 'badge-engine-mongodb'}
              style={{ cursor: 'pointer', border: 'none' }}
            >
              <Database size={13} />
              <span>{activeEngine === 'postgres' ? 'PostgreSQL' : 'MongoDB'}</span>
            </button>

            {lastLatencyMs !== null && (
              <span className="badge-latency" title="Last measured response latency">
                {lastLatencyMs}ms
              </span>
            )}
          </div>

          {/* User Auth Buttons */}
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
                  style={{ width: '30px', height: '30px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-color)' }}
                />
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user.name}</span>
              </Link>

              <button 
                onClick={logout} 
                className="btn btn-secondary" 
                style={{ padding: '0.45rem', borderRadius: 'var(--radius-full)' }}
                title="Log out"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Link to="/login" className="btn btn-secondary" style={{ padding: '0.45rem 0.95rem' }}>
                <LogIn size={14} />
                <span>Log in</span>
              </Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: '0.45rem 0.95rem' }}>
                <UserPlus size={14} />
                <span>Register</span>
              </Link>
            </div>
          )}

        </div>

      </div>
    </nav>
  );
}
