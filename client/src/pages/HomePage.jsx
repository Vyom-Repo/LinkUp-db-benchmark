import React from 'react';
import { Link } from 'react-router-dom';
import { LogIn, UserPlus } from 'lucide-react';

export default function HomePage() {
  return (
    <main style={{
      minHeight: 'calc(100vh - 72px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 1.5rem',
      textAlign: 'center'
    }}>
      <div style={{ maxWidth: '620px', width: '100%' }}>
        
        {/* Centered AI Monogram Logo */}
        <div style={{ marginBottom: '2rem' }}>
          <img 
            src="/logo.jpg" 
            alt="Sync Logo" 
            style={{
              width: '110px',
              height: '110px',
              borderRadius: '24px',
              objectFit: 'cover',
              boxShadow: '0 16px 36px -6px rgba(44, 39, 32, 0.14), 0 4px 12px -2px rgba(44, 39, 32, 0.06)',
              border: '1px solid var(--border-color)',
              margin: '0 auto',
              display: 'block'
            }}
          />
        </div>

        {/* Title */}
        <h1 style={{ 
          fontSize: '3.25rem', 
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
          marginBottom: '2.5rem',
          fontWeight: 400
        }}>
          Sync is a modern, real-time social platform engineered for seamless communication, 
          fluid conversations, and effortless synchronization across communities.
        </p>

        {/* Strictly Only Login and Register Buttons */}
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
              padding: '0.85rem 2.25rem', 
              fontSize: '1rem',
              borderRadius: 'var(--radius-md)',
              minWidth: '150px'
            }}
          >
            <LogIn size={18} />
            <span>Log in</span>
          </Link>

          <Link 
            to="/register"
            className="btn btn-primary" 
            style={{ 
              padding: '0.85rem 2.25rem', 
              fontSize: '1rem',
              borderRadius: 'var(--radius-md)',
              minWidth: '150px'
            }}
          >
            <UserPlus size={18} />
            <span>Register</span>
          </Link>
        </div>

      </div>
    </main>
  );
}
