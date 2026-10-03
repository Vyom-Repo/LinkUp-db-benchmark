import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, Terminal, ArrowRight, Database, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminLoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const { login, logout, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // If already authenticated as admin, go straight to /admin
  React.useEffect(() => {
    if (isAuthenticated && user?.isAdmin) {
      navigate('/admin', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!identifier.trim() || !password) {
      setErrorMsg('Administrator ID/Email and password are required.');
      return;
    }

    setSubmitting(true);
    try {
      // Authenticate directly through AuthContext
      const loggedUser = await login(identifier.trim().toLowerCase(), password);

      // Verify that user possesses platform administrator privileges
      if (!loggedUser || !loggedUser.isAdmin) {
        logout();
        setErrorMsg('Access denied: Account does not have administrator privileges.');
        setSubmitting(false);
        return;
      }

      // Successfully authenticated as Admin -> Go directly to dashboard
      navigate('/admin', { replace: true });
    } catch (err) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('password')) {
        setErrorMsg('Incorrect password.');
      } else if (msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('user')) {
        setErrorMsg('Incorrect administrator ID or account not found.');
      } else {
        setErrorMsg(msg || 'Incorrect password.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-primary)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '2.5rem 1.5rem',
      color: 'var(--text-primary)',
      fontFamily: "'Plus Jakarta Sans', sans-serif"
    }}>
      <div style={{ maxWidth: '440px', width: '100%' }}>
        
        {/* Security Header Banner */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          
          {/* Security Shield Icon */}
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem auto',
            boxShadow: 'var(--shadow-md)'
          }}>
            <ShieldCheck size={32} style={{ color: 'var(--primary)' }} />
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.25rem 0.75rem',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--primary-light)',
            border: '1px solid rgba(154, 91, 50, 0.2)',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: 'var(--primary)',
            marginBottom: '0.75rem',
            letterSpacing: '0.04em',
            textTransform: 'uppercase'
          }}>
            <Terminal size={12} />
            <span>Restricted Gateway</span>
          </div>

          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
            LinkUp Admin Portal
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            System telemetry, dual-engine switching & database benchmark control
          </p>
        </div>

        {/* Security Login Card */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '2rem 1.75rem',
          boxShadow: 'var(--shadow-md)'
        }}>
          {errorMsg && (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.65rem',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderRadius: '8px',
              padding: '0.75rem 0.85rem',
              color: '#B91C1C',
              fontSize: '0.825rem',
              marginBottom: '1.25rem',
              lineHeight: 1.4
            }}>
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#EF4444' }} />
              <div>{errorMsg}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            
            {/* Administrator Identifier */}
            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                Administrator ID / Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text"
                  placeholder="admin@sync.local or admin"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  disabled={submitting}
                  style={{
                    width: '100%',
                    backgroundColor: '#FAF8F4',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                    outline: 'none',
                    transition: 'border-color 0.15s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                />
              </div>
            </div>

            {/* Master Password */}
            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                Master Authorization Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  style={{
                    width: '100%',
                    backgroundColor: '#FAF8F4',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                    outline: 'none',
                    transition: 'border-color 0.15s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.75rem 1.25rem',
                fontSize: '0.875rem',
                fontWeight: 700,
                borderRadius: '8px',
                marginTop: '0.5rem',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <span>{submitting ? 'Verifying Credentials...' : 'Authenticate as Administrator'}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Security Notice */}
          <div style={{
            marginTop: '1.5rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.75rem',
            color: 'var(--text-muted)'
          }}>
            <Database size={13} style={{ color: 'var(--primary)' }} />
            <span>Dual Database Benchmark & Architecture Lab Control Gateway</span>
          </div>

        </div>

        {/* Back Link */}
        <div style={{ textAlign: 'center', marginTop: '1.75rem' }}>
          <Link 
            to="/" 
            style={{
              fontSize: '0.825rem',
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              transition: 'color 0.15s ease'
            }}
            onMouseEnter={(e) => e.target.style.color = 'var(--text-primary)'}
            onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
          >
            ← Return to LinkUp Community Portal
          </Link>
        </div>

      </div>
    </div>
  );
}
