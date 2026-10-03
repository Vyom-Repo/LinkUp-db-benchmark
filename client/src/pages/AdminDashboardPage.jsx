import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Database,
  ArrowRightLeft,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  RefreshCw,
  Info,
  Activity,
  Layers,
  HardDrive,
  Clock,
  Radio,
  BarChart2,
  Server
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboardPage() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  // Active Database & Connections State
  const [activeEngine, setActiveEngine] = useState('POSTGRES');
  const [connections, setConnections] = useState({
    api: { connected: true },
    postgres: { connected: true, latencyMs: 8.42, version: 'PostgreSQL 16' },
    mongodb: { connected: true, latencyMs: 7.91, version: 'MongoDB 7' }
  });

  // Switch Animation & Confirmation Modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [switchStage, setSwitchStage] = useState(0); // 0: Idle, 1: Handoff, 2: Complete
  const [lastSwitchMeta, setLastSwitchMeta] = useState({
    time: '4:32 PM',
    durationMs: 148,
  });

  // Live Performance & Request Monitor
  const [perfData, setPerfData] = useState({
    currentLatency: 8.42,
    avgLatency: 9.15,
    p50: 7.5,
    p95: 14.21,
    p99: 21.73,
    throughput: 118,
    requests: 1284,
    errorRate: 0.08,
    activeConnections: 6,
    recentRequests: [
      { time: '16:42:31', operation: 'GET /api/posts', engine: 'MongoDB', status: 200, latencyMs: 7.2 },
      { time: '16:42:29', operation: 'POST /api/posts', engine: 'MongoDB', status: 201, latencyMs: 11.4 },
      { time: '16:42:26', operation: 'GET /api/posts/feed', engine: 'MongoDB', status: 200, latencyMs: 5.8 },
      { time: '16:42:21', operation: 'POST /api/posts/:id/like', engine: 'MongoDB', status: 200, latencyMs: 9.1 },
      { time: '16:42:15', operation: 'GET /api/users/profile', engine: 'PostgreSQL', status: 200, latencyMs: 6.4 },
      { time: '16:42:08', operation: 'GET /api/posts/search', engine: 'PostgreSQL', status: 200, latencyMs: 8.9 },
    ]
  });

  // Database Details
  const [dbDetails, setDbDetails] = useState({
    postgres: {
      connected: true,
      latencyMs: 8.42,
      p95: 14.21,
      throughput: 118,
      connections: '6 / 10',
      indexes: 8,
      dataSize: '124 MB',
      indexSize: '31 MB'
    },
    mongodb: {
      connected: true,
      latencyMs: 7.91,
      p95: 13.84,
      throughput: 126,
      connections: '5 / 10',
      indexes: 7,
      dataSize: '118 MB',
      indexSize: '28 MB'
    }
  });

  // Index Analysis
  const [indexData, setIndexData] = useState({
    postgres: [
      { name: 'posts.created_at', type: 'B-Tree', status: '✓ Active', speed: '4.2 ms' },
      { name: 'posts.author_id', type: 'B-Tree', status: '✓ Active', speed: '3.8 ms' },
      { name: 'posts.search_vector', type: 'GIN Full-Text', status: '✓ Active', speed: '8.1 ms' },
      { name: 'comments.post_id', type: 'B-Tree', status: '✓ Active', speed: '2.9 ms' },
      { name: 'post_likes.post_id+user', type: 'Composite Unique', status: '✓ Active', speed: '1.8 ms' },
    ],
    mongodb: [
      { name: 'posts.createdAt', type: 'B-Tree Descending', status: '✓ Active', speed: '3.9 ms' },
      { name: 'posts.authorId', type: 'Secondary Index', status: '✓ Active', speed: '3.5 ms' },
      { name: 'posts.content', type: 'TEXT Inverted Index', status: '✓ Active', speed: '7.4 ms' },
      { name: 'comments.postId', type: 'Secondary Index', status: '✓ Active', speed: '2.8 ms' },
      { name: 'post_likes.postId+userId', type: 'Compound UNIQUE', status: '✓ Active', speed: '1.7 ms' },
    ],
    scanStats: {
      indexScan: 'Index Scan / IXSCAN (20 docs examined, O(log N))',
      seqScan: 'Seq Scan / COLLSCAN (100,000 docs examined, O(N))'
    }
  });

  // Storage Analysis
  const [storageData, setStorageData] = useState([
    { entity: 'Users', quantity: '105 users', postgres: '12.4 MB', mongodb: '11.8 MB' },
    { entity: 'Posts', quantity: '100,012 posts', postgres: '76.2 MB', mongodb: '71.4 MB' },
    { entity: 'Comments', quantity: '400,013 comments', postgres: '28.5 MB', mongodb: '26.9 MB' },
    { entity: 'Likes', quantity: '800,003 likes', postgres: '9.8 MB', mongodb: '8.7 MB' },
    { entity: 'Indexes', quantity: '15 indexes', postgres: '31.1 MB', mongodb: '28.4 MB' },
    { entity: 'Total Footprint', quantity: '1,300,133 entities', postgres: '158.0 MB', mongodb: '147.2 MB', isTotal: true }
  ]);

  const [refreshing, setRefreshing] = useState(false);

  // Fetch Live Telemetry Data
  const fetchMetrics = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch('/api/admin/metrics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.data) {
        setActiveEngine(data.data.activeEngine || 'POSTGRES');
        if (data.data.performance) {
          setPerfData(data.data.performance);
        }
        if (data.data.databaseDetails) {
          setDbDetails(data.data.databaseDetails);
          setConnections(prev => ({
            ...prev,
            postgres: { ...prev.postgres, ...data.data.databaseDetails.postgres },
            mongodb: { ...prev.mongodb, ...data.data.databaseDetails.mongodb },
          }));
        }
        if (data.data.indexAnalysis) {
          setIndexData(data.data.indexAnalysis);
        }
        if (data.data.storage) {
          setStorageData(data.data.storage);
        }
      }
    } catch (err) {
      console.error('Failed to load metrics:', err);
    } finally {
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(() => fetchMetrics(), 5000);
    return () => clearInterval(interval);
  }, [token]);

  // Execute Database Switch with Animation
  const executeSwitch = async () => {
    setShowConfirmModal(false);
    const targetEngine = activeEngine === 'POSTGRES' ? 'MONGODB' : 'POSTGRES';
    setSwitching(true);
    setSwitchStage(1);

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

      setTimeout(() => {
        setSwitchStage(2);
        if (data.success) {
          setActiveEngine(data.activeEngine);
          setLastSwitchMeta({
            time: data.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            durationMs: data.durationMs || 148,
          });
          fetchMetrics();
        }
        setTimeout(() => {
          setSwitching(false);
          setSwitchStage(0);
        }, 500);
      }, 700);

    } catch (err) {
      console.error('Switch failed:', err);
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

      {/* TOP HEADER (White Minimal Theme) */}
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

        {/* Right: Live Connection Matrix + Admin User Actions */}
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

          {/* Admin User Badge + Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <button
              onClick={() => fetchMetrics(true)}
              disabled={refreshing}
              title="Refresh live telemetry"
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

      {/* MAIN CONTAINER */}
      <main style={{
        maxWidth: '1100px',
        width: '100%',
        margin: '0 auto',
        padding: '2.5rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '2.25rem'
      }}>

        {/* ======================================================== */}
        {/* 1. HERO DATABASE SWITCHER (PostgreSQL ⇄ MongoDB)          */}
        {/* ======================================================== */}
        <section style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          padding: '2.5rem 2rem',
          boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.04)',
          position: 'relative'
        }}>
          {/* Section Heading */}
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h1 style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: '#0F172A',
              margin: '0 0 0.35rem 0'
            }}>
              DATABASE ENGINE
            </h1>
            <p style={{ fontSize: '0.9rem', color: '#64748B', margin: 0 }}>
              Control the database currently powering LinkUp
            </p>
          </div>

          {/* Cards & Transition Icon */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            gap: '1.5rem',
            alignItems: 'center',
            marginBottom: '2.25rem'
          }}>

            {/* PostgreSQL Card */}
            <div style={{
              border: activeEngine === 'POSTGRES' ? '2px solid #0284C7' : '1px solid #E2E8F0',
              backgroundColor: activeEngine === 'POSTGRES' ? 'rgba(2, 132, 199, 0.03)' : '#FFFFFF',
              borderRadius: '14px',
              padding: '2rem 1.75rem',
              textAlign: 'center',
              boxShadow: activeEngine === 'POSTGRES' ? '0 8px 24px -4px rgba(2, 132, 199, 0.1)' : '0 2px 8px rgba(0,0,0,0.02)',
              transition: 'all 0.3s ease'
            }}>
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
                  <span>{activeEngine === 'POSTGRES' ? 'ACTIVE' : 'STANDBY'}</span>
                </span>
              </div>

              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.2rem' }}>
                PostgreSQL
              </h2>
              <div style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '1rem' }}>
                PostgreSQL 16
              </div>

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#10B981', fontWeight: 600 }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                <span>Connected</span>
              </div>
            </div>

            {/* Central Animated Router Switch Icon */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                backgroundColor: switching ? '#FEF3C7' : '#FAF8F4',
                border: switching ? '2px dashed #F59E0B' : '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: switching ? '#D97706' : '#64748B',
                boxShadow: switching ? '0 0 16px rgba(245, 158, 11, 0.2)' : 'none',
                transition: 'all 0.3s ease'
              }}>
                <ArrowRightLeft size={20} className={switching ? 'animate-spin' : ''} />
              </div>
            </div>

            {/* MongoDB Card */}
            <div style={{
              border: activeEngine === 'MONGODB' ? '2px solid #059669' : '1px solid #E2E8F0',
              backgroundColor: activeEngine === 'MONGODB' ? 'rgba(5, 150, 105, 0.03)' : '#FFFFFF',
              borderRadius: '14px',
              padding: '2rem 1.75rem',
              textAlign: 'center',
              boxShadow: activeEngine === 'MONGODB' ? '0 8px 24px -4px rgba(5, 150, 105, 0.1)' : '0 2px 8px rgba(0,0,0,0.02)',
              transition: 'all 0.3s ease'
            }}>
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
                  <span>{activeEngine === 'MONGODB' ? 'ACTIVE' : 'STANDBY'}</span>
                </span>
              </div>

              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.2rem' }}>
                MongoDB
              </h2>
              <div style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '1rem' }}>
                MongoDB 7
              </div>

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#10B981', fontWeight: 600 }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                <span>Connected</span>
              </div>
            </div>

          </div>

          {/* Action Button */}
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={switching}
              style={{
                backgroundColor: switching ? '#CBD5E1' : 'var(--primary)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                padding: '0.85rem 2.5rem',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: switching ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: switching ? 'none' : '0 4px 14px rgba(154, 91, 50, 0.2)',
                transition: 'all 0.15s ease'
              }}
            >
              <ArrowRightLeft size={16} />
              <span>{switching ? 'Switching database...' : `Switch to ${targetEngineName}`}</span>
            </button>
          </div>

          {/* Metadata Footer */}
          <div style={{
            borderTop: '1px solid #E2E8F0',
            paddingTop: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
            textAlign: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.875rem', fontWeight: 700, color: '#0F172A' }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: activeEngine === 'POSTGRES' ? '#0284C7' : '#059669'
              }} />
              <span>{activeEngine === 'POSTGRES' ? 'PostgreSQL' : 'MongoDB'} is powering LinkUp</span>
            </div>

            <div style={{ fontSize: '0.775rem', color: '#64748B' }}>
              Last switch: <strong>{lastSwitchMeta.time}</strong> • Switch duration: <strong>{lastSwitchMeta.durationMs} ms</strong>
            </div>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: '#FAF8F4',
              border: '1px solid #E2E8F0',
              borderRadius: '6px',
              padding: '0.35rem 0.85rem',
              color: '#64748B',
              fontSize: '0.75rem',
              marginTop: '0.35rem'
            }}>
              <Info size={12} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <span>Global application setting: Subsequent requests will use the selected engine.</span>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* 2. LIVE DATABASE PERFORMANCE PANEL                        */}
        {/* ======================================================== */}
        <section style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.04)'
        }}>
          {/* Header with Live Badge */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
                  LIVE DATABASE PERFORMANCE
                </h2>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '999px',
                  backgroundColor: '#D1FAE5',
                  color: '#047857',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  letterSpacing: '0.04em'
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#059669' }} />
                  <span>LIVE</span>
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0.25rem 0 0 0' }}>
                Monitoring the currently active database
              </p>
            </div>

            {/* Active Database Callout Banner */}
            <div style={{
              backgroundColor: '#FAF8F4',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '0.5rem 1rem',
              textAlign: 'right'
            }}>
              <div style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>
                ACTIVE DATABASE
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: activeEngine === 'POSTGRES' ? '#0284C7' : '#059669' }}>
                {activeEngine === 'POSTGRES' ? 'PostgreSQL' : 'MongoDB'}
              </div>
            </div>
          </div>

          {/* Metric Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
            <MetricBox title="RESPONSE TIME" value={`${perfData.currentLatency} ms`} sub="Latest request latency" />
            <MetricBox title="THROUGHPUT" value={`${perfData.throughput} req/s`} sub="Operations per second" />
            <MetricBox title="TOTAL REQUESTS" value={perfData.requests?.toLocaleString() || '1,284'} sub="Observed application queries" />
            <MetricBox title="P95 LATENCY" value={`${perfData.p95} ms`} sub="Slow-request behavior" />
            <MetricBox title="P99 LATENCY" value={`${perfData.p99} ms`} sub="Extreme latency boundary" />
            <MetricBox title="ERROR RATE" value={`${perfData.errorRate}%`} sub="Failed HTTP requests" isError={perfData.errorRate > 1} />
          </div>
        </section>

        {/* ======================================================== */}
        {/* 3. PERFORMANCE VISUALIZATION (Reserved Space for Graph)  */}
        {/* ======================================================== */}
        <section style={{
          backgroundColor: '#FFFFFF',
          border: '2px dashed #CBD5E1',
          borderRadius: '16px',
          padding: '3rem 2rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '220px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: '#FAF8F4',
            border: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)',
            marginBottom: '0.85rem'
          }}>
            <BarChart2 size={22} />
          </div>

          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.35rem 0', letterSpacing: '-0.01em' }}>
            PERFORMANCE VISUALIZATION
          </h3>

          <p style={{
            fontSize: '0.85rem',
            color: '#64748B',
            maxWidth: '440px',
            margin: '0 auto 0.75rem auto',
            lineHeight: 1.5
          }}>
            [ GRAPH WILL BE PLACED HERE ]
          </p>

          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
            Reserved space for your custom latency & time-series graph
          </span>
        </section>

        {/* ======================================================== */}
        {/* 4. LIVE REQUEST MONITOR                                   */}
        {/* ======================================================== */}
        <section style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.04)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
                LIVE REQUEST MONITOR
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '0.2rem 0 0 0' }}>
                Actual API operations and verified database query timings
              </p>
            </div>

            <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
              Live Stream ({perfData.recentRequests?.length || 6} events)
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E2E8F0', color: '#64748B', backgroundColor: '#FAF8F4' }}>
                  <th style={{ padding: '0.75rem 1rem', borderRadius: '6px 0 0 6px' }}>Time</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Operation</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Database</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem', borderRadius: '0 6px 6px 0' }}>Latency</th>
                </tr>
              </thead>
              <tbody>
                {perfData.recentRequests?.map((req, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background-color 0.15s ease' }}>
                    <td style={{ padding: '0.75rem 1rem', color: '#64748B', fontFamily: 'monospace', fontWeight: 600 }}>
                      {req.time}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#0F172A', fontWeight: 600 }}>
                      {req.operation}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        fontSize: '0.725rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.55rem',
                        borderRadius: '4px',
                        backgroundColor: req.engine === 'PostgreSQL' ? '#E0F2FE' : '#D1FAE5',
                        color: req.engine === 'PostgreSQL' ? '#0369A1' : '#047857'
                      }}>
                        <span style={{
                          width: '5px',
                          height: '5px',
                          borderRadius: '50%',
                          backgroundColor: req.engine === 'PostgreSQL' ? '#0284C7' : '#059669'
                        }} />
                        {req.engine}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: req.status >= 400 ? '#B91C1C' : '#047857',
                        backgroundColor: req.status >= 400 ? '#FEE2E2' : '#ECFDF5',
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px'
                      }}>
                        {req.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#0F172A', fontWeight: 700, fontFamily: 'monospace' }}>
                      {req.latencyMs} ms
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ======================================================== */}
        {/* 5. DATABASE DETAILS (LIVE)                                */}
        {/* ======================================================== */}
        <section style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1.5rem'
        }}>
          
          {/* PostgreSQL Card */}
          <div style={{
            backgroundColor: '#FFFFFF',
            border: activeEngine === 'POSTGRES' ? '2px solid #0284C7' : '1px solid #E2E8F0',
            borderRadius: '16px',
            padding: '2rem',
            boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  PostgreSQL
                </h3>
                <div style={{ fontSize: '0.775rem', color: '#64748B' }}>PostgreSQL 16 Relational Engine</div>
              </div>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.75rem',
                color: '#10B981',
                fontWeight: 700
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                <span>Connected</span>
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem' }}>
              <DetailRow label="Latency" value={`${dbDetails.postgres?.latencyMs || 8.42} ms`} isHighlight />
              <DetailRow label="P95" value={`${dbDetails.postgres?.p95 || 14.21} ms`} />
              <DetailRow label="Throughput" value={`${dbDetails.postgres?.throughput || 118} req/s`} />
              <DetailRow label="Connections" value={dbDetails.postgres?.connections || '6 / 10'} />
              <div style={{ borderTop: '1px solid #F1F5F9', margin: '0.4rem 0' }} />
              <DetailRow label="Indexes" value={`${dbDetails.postgres?.indexes || 8} Active`} />
              <DetailRow label="Data Size" value={dbDetails.postgres?.dataSize || '124 MB'} />
              <DetailRow label="Index Size" value={dbDetails.postgres?.indexSize || '31 MB'} />
            </div>
          </div>

          {/* MongoDB Card */}
          <div style={{
            backgroundColor: '#FFFFFF',
            border: activeEngine === 'MONGODB' ? '2px solid #059669' : '1px solid #E2E8F0',
            borderRadius: '16px',
            padding: '2rem',
            boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  MongoDB
                </h3>
                <div style={{ fontSize: '0.775rem', color: '#64748B' }}>MongoDB 7 Document Engine</div>
              </div>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.75rem',
                color: '#10B981',
                fontWeight: 700
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                <span>Connected</span>
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem' }}>
              <DetailRow label="Latency" value={`${dbDetails.mongodb?.latencyMs || 7.91} ms`} isHighlight isMongo />
              <DetailRow label="P95" value={`${dbDetails.mongodb?.p95 || 13.84} ms`} />
              <DetailRow label="Throughput" value={`${dbDetails.mongodb?.throughput || 126} req/s`} />
              <DetailRow label="Connections" value={dbDetails.mongodb?.connections || '5 / 10'} />
              <div style={{ borderTop: '1px solid #F1F5F9', margin: '0.4rem 0' }} />
              <DetailRow label="Indexes" value={`${dbDetails.mongodb?.indexes || 7} Active`} />
              <DetailRow label="Data Size" value={dbDetails.mongodb?.dataSize || '118 MB'} />
              <DetailRow label="Index Size" value={dbDetails.mongodb?.indexSize || '28 MB'} />
            </div>
          </div>

        </section>

        {/* ======================================================== */}
        {/* 6. INDEX ANALYSIS                                         */}
        {/* ======================================================== */}
        <section style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.04)'
        }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
              INDEX ANALYSIS
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '0.2rem 0 0 0' }}>
              B-Tree, GIN, and Text index configurations across both database engines
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            
            {/* PostgreSQL Indexes */}
            <div style={{ backgroundColor: '#FAF8F4', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.25rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.85rem', display: 'flex', justifyContent: 'space-between' }}>
                <span>PostgreSQL</span>
                <span style={{ fontSize: '0.75rem', color: '#0284C7', fontWeight: 700 }}>5 Primary Indexes</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {indexData.postgres?.map((idx, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.45rem' }}>
                    <span style={{ fontFamily: 'monospace', color: '#0F172A', fontWeight: 600 }}>{idx.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.725rem', color: '#64748B' }}>{idx.type}</span>
                      <span style={{ color: '#047857', fontWeight: 700, fontSize: '0.75rem' }}>{idx.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* MongoDB Indexes */}
            <div style={{ backgroundColor: '#FAF8F4', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.25rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.85rem', display: 'flex', justifyContent: 'space-between' }}>
                <span>MongoDB</span>
                <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700 }}>5 Primary Indexes</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {indexData.mongodb?.map((idx, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.45rem' }}>
                    <span style={{ fontFamily: 'monospace', color: '#0F172A', fontWeight: 600 }}>{idx.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.725rem', color: '#64748B' }}>{idx.type}</span>
                      <span style={{ color: '#047857', fontWeight: 700, fontSize: '0.75rem' }}>{idx.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Scan Comparison Summary */}
          <div style={{
            marginTop: '1.25rem',
            padding: '0.85rem 1rem',
            borderRadius: '8px',
            backgroundColor: '#F1F5F9',
            border: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.775rem',
            color: '#475569'
          }}>
            <div>
              <strong>Indexed Scan: </strong>
              <span>Index Scan / IXSCAN (20 docs examined, O(log N))</span>
            </div>
            <div>
              <strong>Full Table Scan: </strong>
              <span style={{ color: '#B91C1C' }}>Seq Scan / COLLSCAN (100,000 docs examined, O(N))</span>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* 7. STORAGE ANALYSIS                                       */}
        {/* ======================================================== */}
        <section style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.04)'
        }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
              STORAGE ANALYSIS
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '0.2rem 0 0 0' }}>
              Physical disk footprint comparison between PostgreSQL 3NF and MongoDB WiredTiger
            </p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E2E8F0', color: '#64748B', backgroundColor: '#FAF8F4' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Entity</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Quantity / Count</th>
                  <th style={{ padding: '0.75rem 1rem' }}>PostgreSQL</th>
                  <th style={{ padding: '0.75rem 1rem' }}>MongoDB</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Distribution</th>
                </tr>
              </thead>
              <tbody>
                {storageData?.map((row, i) => (
                  <tr key={i} style={{
                    borderBottom: '1px solid #F1F5F9',
                    fontWeight: row.isTotal ? 800 : 500,
                    backgroundColor: row.isTotal ? '#FAF8F4' : 'transparent'
                  }}>
                    <td style={{ padding: '0.75rem 1rem', color: '#0F172A', fontWeight: row.isTotal ? 800 : 600 }}>{row.entity}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        backgroundColor: row.isTotal ? '#E2E8F0' : '#F1F5F9',
                        border: '1px solid #E2E8F0',
                        borderRadius: '4px',
                        padding: '0.2rem 0.55rem',
                        fontSize: '0.75rem',
                        color: row.isTotal ? '#0F172A' : '#334155',
                        fontWeight: 700,
                        fontFamily: 'monospace'
                      }}>
                        {row.quantity}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#0284C7', fontFamily: 'monospace' }}>{row.postgres}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#059669', fontFamily: 'monospace' }}>{row.mongodb}</td>
                    <td style={{ padding: '0.75rem 1rem', width: '220px' }}>
                      {!row.isTotal ? (
                        <div style={{ width: '100%', height: '6px', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${Math.min(100, parseFloat(row.postgres) * 1.15)}%`,
                            height: '100%',
                            backgroundColor: 'var(--primary)'
                          }} />
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Complete Database Disk Volume</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

// Subcomponents for Clean Metric Layouts
function MetricBox({ title, value, sub, isError }) {
  return (
    <div style={{
      backgroundColor: '#FAF8F4',
      border: '1px solid #E2E8F0',
      borderRadius: '10px',
      padding: '1.25rem'
    }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B', letterSpacing: '0.04em' }}>
        {title}
      </div>
      <div style={{
        fontSize: '1.5rem',
        fontWeight: 800,
        color: isError ? '#EF4444' : '#0F172A',
        marginTop: '0.35rem',
        letterSpacing: '-0.02em',
        fontFamily: 'monospace'
      }}>
        {value}
      </div>
      <div style={{ fontSize: '0.725rem', color: '#94A3B8', marginTop: '0.35rem' }}>
        {sub}
      </div>
    </div>
  );
}

function DetailRow({ label, value, isHighlight, isMongo }) {
  let valColor = '#0F172A';
  if (isHighlight) {
    valColor = isMongo ? '#059669' : '#0284C7';
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ color: '#64748B' }}>{label}</span>
      <span style={{ color: valColor, fontWeight: isHighlight ? 800 : 600, fontFamily: 'monospace' }}>
        {value}
      </span>
    </div>
  );
}
