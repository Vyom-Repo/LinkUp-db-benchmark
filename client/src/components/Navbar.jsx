import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDatabase } from '../context/DatabaseContext';
import { 
  Radio, 
  Search, 
  Home, 
  Cpu, 
  User, 
  LogOut, 
  LogIn, 
  UserPlus, 
  Zap,
  Database
} from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { activeEngine, lastLatencyMs, switchEngine, switching } = useDatabase();
  const location = useLocation();

  const isCurrent = (path) => location.pathname === path;

  return (
    <nav className="glass-panel" style={{ 
      position: 'sticky', 
      top: 0, 
      zIndex: 100, 
      borderRadius: 0, 
      borderLeft: 'none', 
      borderRight: 'none', 
      borderTop: 'none',
      borderBottom: '1px solid var(--border-color)',
      padding: '0.75rem 0'
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        
        {/* Logo & Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <Link to="/" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.625rem', 
            textDecoration: 'none',
            color: 'inherit'
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 2px 10px rgba(99, 102, 241, 0.4)'
            }}>
              <Zap size={20} />
            </div>
            <div>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
                Sync
              </span>
            </div>
          </Link>

          {/* Primary Navigation Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Link 
              to="/feed" 
              className="btn btn-secondary" 
              style={{ 
                padding: '0.45rem 0.85rem',
                backgroundColor: isCurrent('/feed') ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                borderColor: isCurrent('/feed') ? 'var(--primary)' : 'transparent',
                color: isCurrent('/feed') ? '#fff' : 'var(--text-secondary)'
              }}
            >
              <Radio size={16} />
              <span>Feed</span>
            </Link>

            <Link 
              to="/search" 
              className="btn btn-secondary" 
              style={{ 
                padding: '0.45rem 0.85rem',
                backgroundColor: isCurrent('/search') ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                borderColor: isCurrent('/search') ? 'var(--primary)' : 'transparent',
                color: isCurrent('/search') ? '#fff' : 'var(--text-secondary)'
              }}
            >
              <Search size={16} />
              <span>Search</span>
            </Link>

            <Link 
              to="/admin" 
              className="btn btn-secondary" 
              style={{ 
                padding: '0.45rem 0.85rem',
                backgroundColor: isCurrent('/admin') ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                borderColor: isCurrent('/admin') ? '#10b981' : 'transparent',
                color: isCurrent('/admin') ? '#34d399' : 'var(--text-secondary)',
                fontWeight: 600
              }}
            >
              <Cpu size={16} />
              <span>Admin Lab</span>
            </Link>
          </div>
        </div>

        {/* Right Section: Engine Quick Switcher & User Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          
          {/* Active Database Engine Badge & Switcher */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            background: 'rgba(0,0,0,0.3)',
            padding: '0.25rem 0.5rem',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-color)'
          }}>
            <button
              onClick={() => switchEngine(activeEngine === 'postgres' ? 'mongodb' : 'postgres')}
              disabled={switching}
              title="Click to toggle active database engine globally"
              className={activeEngine === 'postgres' ? 'badge-engine-postgres' : 'badge-engine-mongodb'}
              style={{ cursor: 'pointer', border: 'none', background: 'transparent' }}
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

          {/* User Section */}
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
                style={{ padding: '0.45rem', borderRadius: 'var(--radius-full)' }}
                title="Log out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Link to="/login" className="btn btn-secondary" style={{ padding: '0.45rem 0.85rem' }}>
                <LogIn size={15} />
                <span>Log in</span>
              </Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: '0.45rem 0.85rem' }}>
                <UserPlus size={15} />
                <span>Sign up</span>
              </Link>
            </div>
          )}

        </div>

      </div>
    </nav>
  );
}
