import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      await login(email, password);
      setSuccessMsg('Logged in successfully! Redirecting...');
      setTimeout(() => {
        navigate('/');
      }, 1200);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 72px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2.5rem 1.5rem',
    }}>
      <div 
        className="card animate-fade-in" 
        style={{ 
          maxWidth: '440px', 
          width: '100%',
          textAlign: 'center' 
        }}
      >
        {/* Brand Icon */}
        <div style={{ marginBottom: '1.25rem' }}>
          <img 
            src="/logo.jpg" 
            alt="Sync Logo" 
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              objectFit: 'cover',
              boxShadow: '0 4px 14px rgba(44, 39, 32, 0.08)',
              margin: '0 auto',
              display: 'block'
            }}
          />
        </div>

        {/* Heading */}
        <h1 style={{ 
          fontSize: '1.85rem', 
          fontWeight: 800, 
          letterSpacing: '-0.03em', 
          color: 'var(--text-primary)',
          marginBottom: '0.4rem' 
        }}>
          Welcome Back
        </h1>
        <p style={{ 
          color: 'var(--text-secondary)', 
          fontSize: '0.9rem', 
          marginBottom: '1.75rem' 
        }}>
          Sign in to your Sync account to continue
        </p>

        {/* Error Alert */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FCA5A5',
            borderRadius: 'var(--radius-md)',
            color: '#B91C1C',
            fontSize: '0.85rem',
            textAlign: 'left',
            marginBottom: '1.25rem'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            backgroundColor: '#F0FDF4',
            border: '1px solid #86EFAC',
            borderRadius: 'var(--radius-md)',
            color: '#15803D',
            fontSize: '0.85rem',
            textAlign: 'left',
            marginBottom: '1.25rem'
          }}>
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Email Field */}
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email or Username</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Mail 
                size={17} 
                style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  color: 'var(--text-muted)', 
                  pointerEvents: 'none' 
                }} 
              />
              <input 
                id="login-email"
                type="text"
                required
                placeholder="name@example.com or username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                disabled={loading}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Lock 
                size={17} 
                style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  color: 'var(--text-muted)', 
                  pointerEvents: 'none' 
                }} 
              />
              <input 
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0
                }}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading}
            className="btn btn-primary"
            style={{ 
              width: '100%', 
              padding: '0.825rem', 
              fontSize: '0.95rem',
              borderRadius: 'var(--radius-md)',
              marginTop: '0.5rem',
              opacity: loading ? 0.7 : 1,
            }}
          >
            <LogIn size={16} />
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
          </button>
        </form>

        {/* Footer Link */}
        <div style={{ 
          marginTop: '1.75rem', 
          paddingTop: '1.25rem', 
          borderTop: '1px solid var(--border-color)',
          fontSize: '0.875rem', 
          color: 'var(--text-secondary)' 
        }}>
          Don't have an account?{' '}
          <Link 
            to="/register" 
            style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}
          >
            Create an account
          </Link>
        </div>

      </div>
    </div>
  );
}
