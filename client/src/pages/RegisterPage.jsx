import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, User, AtSign, Mail, Lock, Eye, EyeOff, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await register({ name, username, email, password, bio });
      setSuccessMsg('Account created successfully! Redirecting...');
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Registration failed.');
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
          maxWidth: '460px', 
          width: '100%',
          textAlign: 'center' 
        }}
      >
        {/* Brand Icon */}
        <div style={{ marginBottom: '1.25rem' }}>
          <img 
            src="/logo.svg" 
            alt="LinkUp Logo" 
            style={{
              width: '56px',
              height: '56px',
              objectFit: 'contain',
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
          Create Your Account
        </h1>
        <p style={{ 
          color: 'var(--text-secondary)', 
          fontSize: '0.9rem', 
          marginBottom: '1.75rem' 
        }}>
          Join the Sync community to connect and communicate seamlessly
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

        {/* Register Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          
          {/* Full Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-name">Full Name</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <User 
                size={17} 
                style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  color: 'var(--text-muted)', 
                  pointerEvents: 'none' 
                }} 
              />
              <input 
                id="reg-name"
                type="text"
                required
                placeholder="Alex Johnson"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                disabled={loading}
              />
            </div>
          </div>

          {/* Username */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-username">Username</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <AtSign 
                size={17} 
                style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  color: 'var(--text-muted)', 
                  pointerEvents: 'none' 
                }} 
              />
              <input 
                id="reg-username"
                type="text"
                required
                placeholder="alexj"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                disabled={loading}
              />
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Email Address</label>
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
                id="reg-email"
                type="email"
                required
                placeholder="alex@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                disabled={loading}
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">Password</label>
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
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="At least 6 characters"
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

          {/* Bio (Optional) */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-bio">Bio (Optional)</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <FileText 
                size={17} 
                style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  color: 'var(--text-muted)', 
                  pointerEvents: 'none' 
                }} 
              />
              <input 
                id="reg-bio"
                type="text"
                placeholder="Tell the community a little about yourself"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                disabled={loading}
              />
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
            <UserPlus size={16} />
            <span>{loading ? 'Creating account...' : 'Create Account'}</span>
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
          Already have an account?{' '}
          <Link 
            to="/login" 
            style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}
          >
            Sign in
          </Link>
        </div>

      </div>
    </div>
  );
}
