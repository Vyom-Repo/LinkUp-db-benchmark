import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Database,
  ArrowRightLeft,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  ExternalLink,
  Clock,
  Shield,
  RefreshCw,
  Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboardPage() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  // Active Database & Connection States
  const [activeEngine, setActiveEngine] = useState('POSTGRES');
  const [connections, setConnections] = useState({
    api: { connected: true },
    postgres: { connected: true, latencyMs: 0.85, version: 'PostgreSQL 16' },
    mongodb: { connected: true, latencyMs: 1.12, version: 'MongoDB 7' }
  });

  // Switch Animation & Confirmation States
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [switchStage, setSwitchStage] = useState(0); // 0: Idle, 1: Disconnecting old, 2: Routing stream, 3: Connecting target, 4: Complete
  const [lastSwitchMeta, setLastSwitchMeta] = useState({
    time: '4:32 PM',
    durationMs: 148,
  });

  // In-Memory Recent Engine Changes Audit
  const [switchHistory, setSwitchHistory] = useState([
    { toEngine: 'POSTGRES', fromEngine: 'MONGODB', timestamp: '16:42:18', durationMs: 142 },
    { toEngine: 'MONGODB', fromEngine: 'POSTGRES', timestamp: '16:31:04', durationMs: 168 },
    { toEngine: 'POSTGRES', fromEngine: 'MONGODB', timestamp: '15:56:12', durationMs: 184 },
  ]);

  const [refreshing, setRefreshing] = useState(false);

  // Fetch Telemetry & Live Engine State
  const fetchState = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch('/api/admin/metrics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.data) {
        setActiveEngine(data.data.activeEngine || 'POSTGRES');
        if (data.data.postgres) {
          setConnections(prev => ({
            ...prev,
            postgres: { ...prev.postgres, ...data.data.postgres },
            mongodb: { ...prev.mongodb, ...data.data.mongodb },
          }));
        }
        if (data.data.switchHistory && data.data.switchHistory.length > 0) {
          setSwitchHistory(data.data.switchHistory);
        }
      }
    } catch (e) {
      console.error('Failed to load engine state:', e);
    } finally {
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(() => fetchState(), 8000);
    return () => clearInterval(interval);
  }, [token]);

  // Execute Dynamic Database Switch
  const executeSwitch = async () => {
    setShowConfirmModal(false);
    const targetEngine = activeEngine === 'POSTGRES' ? 'MONGODB' : 'POSTGRES';
    setSwitching(true);

    // Sequence Stages:
    // Stage 1 (0-300ms): Disconnecting current engine
    setSwitchStage(1);
    
    // Stage 2 (300-750ms): Router stream transit
    setTimeout(() => setSwitchStage(2), 300);

    // Stage 3 (750-1100ms): Target engine connection handshake
    setTimeout(() => setSwitchStage(3), 750);

    try {
      const res = await fetch('/api/admin/db-switch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ engine: targetEngine })
      });
      const data = await res.json();

      if (data.success) {
        // Stage 4 (1100ms): Complete
        setTimeout(() => {
          setSwitchStage(4);
          setActiveEngine(data.activeEngine);
          setLastSwitchMeta({
            time: data.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            durationMs: data.durationMs || 148,
          });
          if (data.switchHistory) {
            setSwitchHistory(data.switchHistory);
          }
          
          // Reset to normal state
          setTimeout(() => {
            setSwitching(false);
            setSwitchStage(0);
          }, 600);
        }, 1100);
      } else {
        setSwitching(false);
        setSwitchStage(0);
      }
    } catch (err) {
      console.error('Error switching database:', err);
      setSwitching(false);
      setSwitchStage(0);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const targetEngineName = activeEngine === 'POSTGRES' ? 'MongoDB' : 'PostgreSQL';

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F8F6F0',
      color: '#0F172A',
      fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      display: 'flex',
      flexDirection: 'column'
    }}>

      {/* 1. TOP HEADER (White Minimal Theme) */}
      <header style={{
        height: '64px',
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2rem',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        {/* Left: Brand Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            backgroundColor: '#FAF8F4',
            border: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)'
          }}>
            <Database size={18} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '0.95rem', letterSpacing: '-0.01em' }}>
            <span style={{ color: '#0F172A' }}>LINKUP</span>
            <span style={{ color: '#94A3B8', fontWeight: 400 }}>/</span>
            <span style={{ color: 'var(--primary)', fontWeight: 700 }}>DATABASE LAB</span>
          </div>
        </div>

        {/* Right: Real-time Connection Indicators + Admin Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.75rem' }}>
          
          {/* Connection Indicators */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.8rem', fontWeight: 600 }}>
            {/* API */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#475569' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }} />
              <span>API</span>
            </div>

            {/* PostgreSQL */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#475569' }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: connections.postgres?.connected ? '#10B981' : '#EF4444',
                display: 'inline-block'
              }} />
              <span>PostgreSQL</span>
              {connections.postgres?.latencyMs && (
                <span style={{ fontSize: '0.725rem', color: '#94A3B8', fontWeight: 500 }}>
                  ({connections.postgres.latencyMs}ms)
                </span>
              )}
            </div>

            {/* MongoDB */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#475569' }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: connections.mongodb?.connected ? '#10B981' : '#EF4444',
                display: 'inline-block'
              }} />
              <span>MongoDB</span>
              {connections.mongodb?.latencyMs && (
                <span style={{ fontSize: '0.725rem', color: '#94A3B8', fontWeight: 500 }}>
                  ({connections.mongodb.latencyMs}ms)
                </span>
              )}
            </div>
          </div>

          <div style={{ height: '22px', width: '1px', backgroundColor: '#E2E8F0' }} />

          {/* Admin Identity & Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <button
              onClick={() => fetchState(true)}
              disabled={refreshing}
              title="Refresh connection status"
              style={{
                background: 'none',
                border: '1px solid #E2E8F0',
                borderRadius: '6px',
                padding: '0.4rem 0.5rem',
                color: '#64748B',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            </button>

            <span style={{ fontSize: '0.825rem', color: '#0F172A', fontWeight: 700 }}>
              {user?.username || 'Admin'}
            </span>

            <button
              onClick={handleLogout}
              title="Logout from admin portal"
              style={{
                backgroundColor: '#FAF8F4',
                border: '1px solid #E2E8F0',
                color: '#B91C1C',
                padding: '0.4rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.775rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <LogOut size={13} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO CONTROL SECTION: DATABASE SWITCHER */}
      <main style={{
        maxWidth: '1040px',
        width: '100%',
        margin: '0 auto',
        padding: '2.5rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem'
      }}>

        {/* Hero Card Container */}
        <section style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          padding: '2.5rem 2rem',
          boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
          position: 'relative',
          overflow: 'hidden'
        }}>

          {/* Section Header */}
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.25rem 0.75rem',
              borderRadius: '999px',
              backgroundColor: '#FAF8F4',
              border: '1px solid #E2E8F0',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--primary)',
              marginBottom: '0.65rem',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              <Shield size={12} />
              <span>System-Level Engine Control</span>
            </div>

            <h1 style={{
              fontSize: '1.85rem',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: '#0F172A',
              margin: '0 0 0.4rem 0'
            }}>
              DATABASE ENGINE
            </h1>

            <p style={{
              fontSize: '0.925rem',
              color: '#64748B',
              margin: 0
            }}>
              Control the database currently powering LinkUp
            </p>
          </div>

          {/* TWO LARGE DATABASE CARDS + CENTRAL ROUTER TRANSITION */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            gap: '1.5rem',
            alignItems: 'center',
            marginBottom: '2.5rem'
          }}>

            {/* CARD 1: POSTGRESQL */}
            <div style={{
              border: activeEngine === 'POSTGRES' ? '2px solid #0284C7' : '1px solid #E2E8F0',
              backgroundColor: activeEngine === 'POSTGRES' ? 'rgba(2, 132, 199, 0.03)' : '#FFFFFF',
              borderRadius: '14px',
              padding: '2rem 1.75rem',
              textAlign: 'center',
              boxShadow: activeEngine === 'POSTGRES' ? '0 8px 24px -4px rgba(2, 132, 199, 0.12)' : '0 2px 8px rgba(0,0,0,0.02)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative'
            }}>
              {/* Badge */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '999px',
                  fontSize: '0.725rem',
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                  backgroundColor: activeEngine === 'POSTGRES' ? '#E0F2FE' : '#F1F5F9',
                  color: activeEngine === 'POSTGRES' ? '#0369A1' : '#64748B',
                  border: activeEngine === 'POSTGRES' ? '1px solid #BAE6FD' : '1px solid #E2E8F0'
                }}>
                  <span style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: activeEngine === 'POSTGRES' ? '#0284C7' : '#94A3B8'
                  }} />
                  <span>{activeEngine === 'POSTGRES' ? 'ACTIVE' : 'READY'}</span>
                </span>
              </div>

              <h2 style={{
                fontSize: '1.45rem',
                fontWeight: 800,
                color: '#0F172A',
                marginBottom: '0.25rem',
                letterSpacing: '-0.02em'
              }}>
                PostgreSQL
              </h2>

              <div style={{ fontSize: '0.825rem', color: '#64748B', marginBottom: '1.25rem', fontWeight: 500 }}>
                PostgreSQL 16
              </div>

              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.775rem',
                color: connections.postgres?.connected ? '#10B981' : '#EF4444',
                fontWeight: 600
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                <span>Connected</span>
              </div>
            </div>

            {/* CENTRAL TRANSITION / ROUTER HANDOFF ANIMATION */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 0.5rem',
              position: 'relative'
            }}>
              
              {/* Switching Visual Pulse Stream */}
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: switching ? '#FEF3C7' : '#FAF8F4',
                border: switching ? '2px dashed #F59E0B' : '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: switching ? '#D97706' : '#64748B',
                boxShadow: switching ? '0 0 16px rgba(245, 158, 11, 0.25)' : 'none',
                transition: 'all 0.3s ease'
              }}>
                <ArrowRightLeft size={22} className={switching ? 'animate-spin' : ''} />
              </div>

              {switching && (
                <div style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: '#D97706',
                  marginTop: '0.5rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  {switchStage === 1 && 'Handoff...'}
                  {switchStage === 2 && 'Routing...'}
                  {switchStage === 3 && 'Connecting...'}
                  {switchStage === 4 && 'Complete!'}
                </div>
              )}
            </div>

            {/* CARD 2: MONGODB */}
            <div style={{
              border: activeEngine === 'MONGODB' ? '2px solid #059669' : '1px solid #E2E8F0',
              backgroundColor: activeEngine === 'MONGODB' ? 'rgba(5, 150, 105, 0.03)' : '#FFFFFF',
              borderRadius: '14px',
              padding: '2rem 1.75rem',
              textAlign: 'center',
              boxShadow: activeEngine === 'MONGODB' ? '0 8px 24px -4px rgba(5, 150, 105, 0.12)' : '0 2px 8px rgba(0,0,0,0.02)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative'
            }}>
              {/* Badge */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '999px',
                  fontSize: '0.725rem',
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                  backgroundColor: activeEngine === 'MONGODB' ? '#D1FAE5' : '#F1F5F9',
                  color: activeEngine === 'MONGODB' ? '#047857' : '#64748B',
                  border: activeEngine === 'MONGODB' ? '1px solid #A7F3D0' : '1px solid #E2E8F0'
                }}>
                  <span style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: activeEngine === 'MONGODB' ? '#059669' : '#94A3B8'
                  }} />
                  <span>{activeEngine === 'MONGODB' ? 'ACTIVE' : 'READY'}</span>
                </span>
              </div>

              <h2 style={{
                fontSize: '1.45rem',
                fontWeight: 800,
                color: '#0F172A',
                marginBottom: '0.25rem',
                letterSpacing: '-0.02em'
              }}>
                MongoDB
              </h2>

              <div style={{ fontSize: '0.825rem', color: '#64748B', marginBottom: '1.25rem', fontWeight: 500 }}>
                MongoDB 7
              </div>

              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.775rem',
                color: connections.mongodb?.connected ? '#10B981' : '#EF4444',
                fontWeight: 600
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                <span>Connected</span>
              </div>
            </div>

          </div>

          {/* ACTION BUTTON (Contextual Label) */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={switching}
              style={{
                backgroundColor: switching ? '#E2E8F0' : 'var(--primary)',
                color: switching ? '#64748B' : '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                padding: '0.85rem 2.25rem',
                fontSize: '0.95rem',
                fontWeight: 700,
                letterSpacing: '-0.01em',
                cursor: switching ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: switching ? 'none' : '0 4px 14px rgba(154, 91, 50, 0.25)',
                transition: 'all 0.15s ease'
              }}
            >
              <ArrowRightLeft size={16} />
              <span>
                {switching ? 'Switching database...' : `Switch to ${targetEngineName}`}
              </span>
            </button>
          </div>

          {/* ENGINE STATUS & METADATA FOOTER */}
          <div style={{
            borderTop: '1px solid #E2E8F0',
            paddingTop: '1.75rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.65rem',
            textAlign: 'center'
          }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.9rem', fontWeight: 700, color: '#0F172A' }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: activeEngine === 'POSTGRES' ? '#0284C7' : '#059669'
              }} />
              <span>{activeEngine === 'POSTGRES' ? 'PostgreSQL' : 'MongoDB'} is powering LinkUp</span>
            </div>

            <div style={{ fontSize: '0.8rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span>Last switch: <strong>{lastSwitchMeta.time}</strong></span>
              <span>•</span>
              <span>Switch duration: <strong>{lastSwitchMeta.durationMs} ms</strong></span>
            </div>

            {/* Impact Notice */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: '#FAF8F4',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '0.45rem 1rem',
              color: '#64748B',
              fontSize: '0.775rem',
              marginTop: '0.5rem'
            }}>
              <Info size={13} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <span>
                <strong>Global application setting:</strong> Subsequent requests from all users will route through the selected engine.
              </span>
            </div>

          </div>

          {/* RECENT ENGINE CHANGES (In-Hero Timeline) */}
          {switchHistory && switchHistory.length > 0 && (
            <div style={{
              marginTop: '1.75rem',
              paddingTop: '1.25rem',
              borderTop: '1px dashed #E2E8F0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94A3B8', marginBottom: '0.65rem' }}>
                RECENT ENGINE CHANGES
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                {switchHistory.slice(0, 3).map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#475569' }}>
                    <span style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: item.toEngine === 'POSTGRES' ? '#0284C7' : '#059669'
                    }} />
                    <strong>{item.toEngine === 'POSTGRES' ? 'PostgreSQL' : 'MongoDB'}</strong>
                    <span style={{ color: '#94A3B8' }}>{item.timestamp}</span>
                    <span style={{ color: '#CBD5E1' }}>•</span>
                    <span style={{ color: '#94A3B8' }}>{item.durationMs || 148}ms</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </section>

        {/* 3. RESERVED LARGE AREA FOR FUTURE DASHBOARD CONTENT */}
        <section style={{
          minHeight: '260px',
          borderRadius: '16px',
          border: '1px dashed #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          backgroundColor: 'transparent'
        }}>
          {/* Deliberately left completely open and unobstructed as requested */}
        </section>

      </main>

      {/* CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            padding: '2rem',
            maxWidth: '440px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: '#FAF8F4',
              border: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto',
              color: 'var(--primary)'
            }}>
              <ArrowRightLeft size={22} />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.4rem', letterSpacing: '-0.02em' }}>
              Switch Database Engine?
            </h3>

            <p style={{ fontSize: '0.85rem', color: '#64748B', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              <strong>{targetEngineName}</strong> will become the active database for subsequent LinkUp requests from all users.
            </p>

            <div style={{
              backgroundColor: '#FAF8F4',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              padding: '0.85rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.75rem',
              fontSize: '0.8rem'
            }}>
              <div>
                <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.7rem' }}>CURRENT</span>
                <strong style={{ color: '#0F172A' }}>{activeEngine === 'POSTGRES' ? 'PostgreSQL' : 'MongoDB'}</strong>
              </div>

              <span style={{ color: 'var(--primary)', fontWeight: 800 }}>→</span>

              <div>
                <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.7rem' }}>TARGET</span>
                <strong style={{ color: targetEngineName === 'PostgreSQL' ? '#0284C7' : '#059669' }}>{targetEngineName}</strong>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                onClick={() => setShowConfirmModal(false)}
                style={{
                  padding: '0.65rem 1rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  borderRadius: '8px',
                  backgroundColor: '#FFFFFF',
                  color: '#475569',
                  border: '1px solid #E2E8F0',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                onClick={executeSwitch}
                style={{
                  padding: '0.65rem 1rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  borderRadius: '8px',
                  backgroundColor: 'var(--primary)',
                  color: '#FFFFFF',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Confirm Switch
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
