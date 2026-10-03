import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, Lock, Mail, Terminal, ArrowRight, Database, CheckCircle2, AlertTriangle } from 'lucide-react';
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
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: identifier.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setErrorMsg(data.error?.message || 'Authentication failed. Invalid administrator credentials.');
        setSubmitting(false);
        return;
      }

      // Check if logged-in user possesses true administrative clearance
      const loggedUser = data.data.user;
      if (!loggedUser.isAdmin) {
        setErrorMsg('Access Denied: Account does not possess administrator clearance.');
        setSubmitting(false);
        return;
      }

      // Store authenticated admin session
      login(loggedUser, data.data.token);
      navigate('/admin', { replace: true });
    } catch (err) {
      setErrorMsg('Network error connecting to LinkUp authentication service.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0F172A',
      backgroundImage: 'radial-gradient(ellipse at 50% 0%, #1E293B 0%, #0F172A 75%)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '2rem 1.5rem',
      color: '#F8FAFC',
      fontFamily: "'Plus Jakarta Sans', sans-serif"
    }}>
      <div style={{ maxWidth: '440px', width: '100%' }}>
        
        {/* Security Header Banner */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            backgroundColor: 'rgba(30, 41, 59, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem auto',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
          }}>
            <ShieldAlert size={32} style={{ color: '#38BDF8' }} />
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px',
            backgroundColor: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#38BDF8',
            marginBottom: '0.75rem',
            letterSpacing: '0.04em',
            textTransform: 'uppercase'
          }}>
            <Terminal size={12} />
            <span>Restricted Gateway</span>
          </div>

          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#FFFFFF', marginBottom: '0.4rem' }}>
            LinkUp Admin Portal
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#94A3B8', lineHeight: 1.4 }}>
            System telemetry, dual-engine switching & database benchmark control
          </p>
        </div>

        {/* Security Login Card */}
        <div style={{
          backgroundColor: 'rgba(30, 41, 59, 0.65)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '2rem 1.75rem',
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.6)'
        }}>
          {errorMsg && (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.65rem',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: '8px',
              padding: '0.75rem 0.85rem',
              color: '#FCA5A5',
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
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '0.4rem' }}>
                Administrator ID / Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                <input 
                  type="text"
                  placeholder="admin@sync.local or admin"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  disabled={submitting}
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(15, 23, 42, 0.75)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                    color: '#FFFFFF',
                    fontSize: '0.875rem',
                    outline: 'none',
                    transition: 'border-color 0.15s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#38BDF8'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)'}
                />
              </div>
            </div>

            {/* Master Password */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '0.4rem' }}>
                Master Authorization Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
                <input 
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(15, 23, 42, 0.75)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                    color: '#FFFFFF',
                    fontSize: '0.875rem',
                    outline: 'none',
                    transition: 'border-color 0.15s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#38BDF8'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)'}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                backgroundColor: '#0284C7',
                backgroundImage: 'linear-gradient(to right, #0284C7, #0EA5E9)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                padding: '0.75rem 1.25rem',
                fontSize: '0.875rem',
                fontWeight: 700,
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1,
                marginTop: '0.5rem',
                boxShadow: '0 4px 14px rgba(14, 165, 233, 0.3)',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease'
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
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.725rem',
            color: '#64748B'
          }}>
            <Database size={13} style={{ color: '#38BDF8' }} />
            <span>Dual Database Benchmark & Architecture Lab Control Gateway</span>
          </div>

        </div>

        {/* Back Link */}
        <div style={{ textAlign: 'center', marginTop: '1.75rem' }}>
          <Link 
            to="/" 
            style={{
              fontSize: '0.825rem',
              color: '#94A3B8',
              textDecoration: 'none',
              transition: 'color 0.15s ease'
            }}
            onMouseEnter={(e) => e.target.style.color = '#FFFFFF'}
            onMouseLeave={(e) => e.target.style.color = '#94A3B8'}
          >
            ← Return to LinkUp Community Portal
          </Link>
        </div>

      </div>
    </div>
  );
}
