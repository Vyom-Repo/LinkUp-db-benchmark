import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, LogOut, Home, Compass, Search } from 'lucide-react';
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

  const [navSearch, setNavSearch] = React.useState('');

  const handleNavSearch = (e) => {
    e.preventDefault();
    if (navSearch.trim()) {
      navigate(`/explore?q=${encodeURIComponent(navSearch.trim())}`);
      setNavSearch('');
    }
  };

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backgroundColor: 'rgba(255, 255, 255, 0.96)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-color)',
      padding: '0.75rem 0'
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        
        {/* Left: Brand + Quick Nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
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
              alt="LinkUp Logo" 
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                objectFit: 'cover',
                boxShadow: '0 2px 6px rgba(44, 39, 32, 0.08)'
              }} 
            />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)', lineHeight: 1.1 }}>
                LinkUp
              </span>
            </div>
          </Link>

          {/* Quick Page Links */}
          {isAuthenticated && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Link
                to="/feed"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.4rem 0.75rem',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: isCurrent('/feed') ? 'var(--primary)' : 'var(--text-secondary)',
                  backgroundColor: isCurrent('/feed') ? 'var(--primary-light)' : 'transparent',
                  transition: 'all 0.15s ease'
                }}
              >
                <Home size={15} />
                <span>Feed</span>
              </Link>

              <Link
                to="/explore"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.4rem 0.75rem',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: isCurrent('/explore') ? 'var(--primary)' : 'var(--text-secondary)',
                  backgroundColor: isCurrent('/explore') ? 'var(--primary-light)' : 'transparent',
                  transition: 'all 0.15s ease'
                }}
              >
                <Compass size={15} />
                <span>Explore</span>
              </Link>
            </div>
          )}
        </div>

        {/* Center: Search when logged in */}
        {isAuthenticated && (
          <form 
            onSubmit={handleNavSearch}
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#F7F5F0',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-full)',
              padding: '0.35rem 0.85rem',
              width: '100%',
              maxWidth: '320px',
              gap: '0.5rem'
            }}
          >
            <Search size={15} style={{ color: 'var(--text-muted)' }} />
            <input 
              type="text"
              placeholder="Search discussions or topics..."
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '0.825rem',
                width: '100%',
                color: 'var(--text-primary)'
              }}
            />
          </form>
        )}

        {/* Right Section: Auth State Dependent */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Link 
                to={`/profile/${user?.username}`} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.55rem',
                  textDecoration: 'none',
                  color: 'inherit',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '8px',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F2EFE9'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                title="View your profile"
              >
                <img 
                  src={user?.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.username || 'user'}`} 
                  alt={user?.name || 'User'} 
                  style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--border-color)', objectFit: 'cover' }}
                />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                    {user?.name}
                  </span>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                    @{user?.username}
                  </span>
                </div>
              </Link>

              <button
                onClick={handleLogout}
                className="btn btn-secondary"
                style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem', borderRadius: 'var(--radius-md)' }}
                title="Log out"
              >
                <LogOut size={13} />
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
