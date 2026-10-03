import React from 'react';
import { Link } from 'react-router-dom';
import { LogIn, UserPlus, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div style={{
      minHeight: 'calc(100vh - 72px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.5rem',
      backgroundColor: 'var(--bg-primary)',
      textAlign: 'center'
    }}>
      <div style={{ maxWidth: '640px', width: '100%' }}>
        
        {/* Prominent AI Generated Brand Logo */}
        <div style={{ marginBottom: '2rem' }}>
          <img 
            src="/logo.jpg" 
            alt="Sync Logo" 
            style={{
              width: '110px',
              height: '110px',
              borderRadius: '24px',
              objectFit: 'cover',
              boxShadow: '0 12px 32px -4px rgba(44, 39, 32, 0.12), 0 4px 12px -2px rgba(44, 39, 32, 0.06)',
              border: '1px solid var(--border-color)',
              margin: '0 auto'
            }}
          />
        </div>

        {/* Brand Name */}
        <h1 style={{ 
          fontSize: '3rem', 
          fontWeight: 800, 
          letterSpacing: '-0.04em', 
          color: 'var(--text-primary)',
          marginBottom: '1rem',
          lineHeight: '1.1'
        }}>
          Sync
        </h1>

        {/* About Sync Statement */}
        <p style={{ 
          fontSize: '1.2rem', 
          color: 'var(--text-secondary)', 
          lineHeight: '1.7', 
          marginBottom: '2.75rem',
          fontWeight: 400
        }}>
          Sync is a modern, real-time social platform engineered for seamless communication, 
          fluid conversations, and effortless synchronization across communities.
        </p>

        {/* ONLY Login and Register Buttons (As strictly requested) */}
        {!isAuthenticated ? (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '1rem', 
            flexWrap: 'wrap' 
          }}>
            <Link 
              to="/login" 
              className="btn btn-secondary" 
              style={{ 
                padding: '0.875rem 2.25rem', 
                fontSize: '1rem',
                borderRadius: 'var(--radius-md)',
                minWidth: '150px',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <LogIn size={18} />
              <span>Log in</span>
            </Link>

            <Link 
              to="/register" 
              className="btn btn-primary" 
              style={{ 
                padding: '0.875rem 2.25rem', 
                fontSize: '1rem',
                borderRadius: 'var(--radius-md)',
                minWidth: '150px'
              }}
            >
              <UserPlus size={18} />
              <span>Register</span>
            </Link>
          </div>
        ) : (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: '1rem' 
          }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Welcome back, <strong>{user.name}</strong>.
            </p>
            <Link 
              to="/feed" 
              className="btn btn-primary" 
              style={{ 
                padding: '0.875rem 2.25rem', 
                fontSize: '1rem',
                borderRadius: 'var(--radius-md)'
              }}
            >
              <span>Go to Social Feed</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
