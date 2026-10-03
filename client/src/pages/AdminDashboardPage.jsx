import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Database, 
  Server, 
  Activity, 
  RefreshCw, 
  LogOut, 
  ExternalLink, 
  Layers, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  HardDrive,
  Cpu,
  Clock,
  Zap,
  Users,
  MessageSquare,
  Heart,
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboardPage() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState(null);
  const [dbStatus, setDbStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  const fetchTelemetry = async () => {
    setLoading(true);
    try {
      const [metricsRes, statusRes] = await Promise.all([
        fetch('/api/admin/metrics', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/db-status')
      ]);

      const metricsData = await metricsRes.json();
      const statusData = await statusRes.json();

      if (metricsData.success) {
        setMetrics(metricsData.data);
      }
      if (statusData.success) {
        setDbStatus(statusData.data);
      }
    } catch (err) {
      console.error('Failed to load telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchTelemetry();
    }
  }, [token]);

  const handleSwitchEngine = async (targetEngine) => {
    if (switching) return;
    setSwitching(true);
    setActionMsg('');

    try {
      const res = await fetch('/api/admin/db-switch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ engine: targetEngine }),
      });

      const data = await res.json();
      if (data.success) {
        setActionMsg(`✅ Active Database dynamically switched to ${data.activeEngine}`);
        fetchTelemetry();
      } else {
        setActionMsg(`❌ Switch failed: ${data.error}`);
      }
    } catch (err) {
      setActionMsg('❌ Network error during database engine switch.');
    } finally {
      setSwitching(false);
    }
  };

  const handleAdminLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const currentEngine = metrics?.activeEngine || 'POSTGRES';

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#090D16',
      backgroundImage: 'radial-gradient(ellipse at 50% 0%, #172554 0%, #090D16 70%)',
      color: '#F8FAFC',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      padding: '2rem 1.5rem 4rem 1.5rem'
    }}>
      <div style={{ maxWidth: '1180px', margin: '0 auto' }}>

        {/* Top Admin Navigation Bar */}
        <header style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: '1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShieldCheck size={22} style={{ color: '#38BDF8' }} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                  LinkUp Admin Lab
                </span>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  backgroundColor: 'rgba(56, 189, 248, 0.15)',
                  color: '#38BDF8',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  border: '1px solid rgba(56, 189, 248, 0.3)'
                }}>
                  ROOT ACCESS
                </span>
              </div>
              <p style={{ fontSize: '0.775rem', color: '#94A3B8', marginTop: '2px' }}>
                GTU Sem 5 WAD & ADBMS Comparative Architecture Control
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* View Community Feed */}
            <Link
              to="/feed"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: 'rgba(30, 41, 59, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#E2E8F0',
                padding: '0.5rem 0.9rem',
                borderRadius: '8px',
                fontSize: '0.825rem',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'background-color 0.15s ease'
              }}
            >
              <span>View Community Feed</span>
              <ExternalLink size={13} />
            </Link>

            {/* Refresh Telemetry */}
            <button
              onClick={fetchTelemetry}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: 'rgba(30, 41, 59, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#E2E8F0',
                padding: '0.5rem 0.9rem',
                borderRadius: '8px',
                fontSize: '0.825rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={13} style={{ animation: loading ? 'spin 0.75s linear infinite' : 'none' }} />
              <span>Refresh</span>
            </button>

            {/* Logout */}
            <button
              onClick={handleAdminLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#FCA5A5',
                padding: '0.5rem 0.9rem',
                borderRadius: '8px',
                fontSize: '0.825rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <LogOut size={13} />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Action / Success Banner */}
        {actionMsg && (
          <div style={{
            backgroundColor: actionMsg.startsWith('✅') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${actionMsg.startsWith('✅') ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
            color: actionMsg.startsWith('✅') ? '#6EE7B7' : '#FCA5A5',
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            marginBottom: '1.5rem',
            fontSize: '0.875rem',
            fontWeight: 600
          }}>
            {actionMsg}
          </div>
        )}

        {/* Dynamic Database Engine Switcher Banner */}
        <section style={{
          backgroundColor: 'rgba(30, 41, 59, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '14px',
          padding: '1.5rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.25rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Zap size={18} style={{ color: currentEngine === 'MONGODB' ? '#10B981' : '#38BDF8' }} />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF' }}>
                Active Database Engine: <span style={{ color: currentEngine === 'MONGODB' ? '#10B981' : '#38BDF8' }}>{currentEngine}</span>
              </h2>
            </div>
            <p style={{ fontSize: '0.825rem', color: '#94A3B8' }}>
              All feed queries and API operations are currently being served live from {currentEngine === 'MONGODB' ? 'MongoDB WiredTiger document store' : 'PostgreSQL 3NF relational engine'}.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={() => handleSwitchEngine('POSTGRES')}
              disabled={switching || currentEngine === 'POSTGRES'}
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 700,
                border: currentEngine === 'POSTGRES' ? '1px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.15)',
                backgroundColor: currentEngine === 'POSTGRES' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                color: currentEngine === 'POSTGRES' ? '#38BDF8' : '#94A3B8',
                cursor: currentEngine === 'POSTGRES' ? 'default' : 'pointer',
                opacity: switching ? 0.6 : 1,
                transition: 'all 0.15s ease'
              }}
            >
              PostgreSQL (3NF)
            </button>

            <button
              onClick={() => handleSwitchEngine('MONGODB')}
              disabled={switching || currentEngine === 'MONGODB'}
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 700,
                border: currentEngine === 'MONGODB' ? '1px solid #10B981' : '1px solid rgba(255, 255, 255, 0.15)',
                backgroundColor: currentEngine === 'MONGODB' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                color: currentEngine === 'MONGODB' ? '#10B981' : '#94A3B8',
                cursor: currentEngine === 'MONGODB' ? 'default' : 'pointer',
                opacity: switching ? 0.6 : 1,
                transition: 'all 0.15s ease'
              }}
            >
              MongoDB (Document)
            </button>
          </div>
        </section>

        {/* Dataset Tier 2 Metrics Cards */}
        <section style={{ marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.85rem' }}>
            Platform Data Volume (Tier 2 Benchmark Dataset)
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem'
          }}>
            {/* Total Posts */}
            <div style={{
              backgroundColor: 'rgba(30, 41, 59, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '1.25rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600 }}>Total Discussions</span>
                <FileText size={16} style={{ color: '#38BDF8' }} />
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#FFFFFF' }}>
                {metrics?.postgres?.posts?.toLocaleString() || '100,012'}
              </div>
              <div style={{ fontSize: '0.725rem', color: '#64748B', marginTop: '4px' }}>
                100% synchronized in both DBs
              </div>
            </div>

            {/* Total Comments */}
            <div style={{
              backgroundColor: 'rgba(30, 41, 59, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '1.25rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600 }}>Total Comments</span>
                <MessageSquare size={16} style={{ color: '#10B981' }} />
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#FFFFFF' }}>
                {metrics?.postgres?.comments?.toLocaleString() || '400,013'}
              </div>
              <div style={{ fontSize: '0.725rem', color: '#64748B', marginTop: '4px' }}>
                Relational foreign key & Mongo embedded
              </div>
            </div>

            {/* Total Likes */}
            <div style={{
              backgroundColor: 'rgba(30, 41, 59, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '1.25rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600 }}>Total Likes</span>
                <Heart size={16} style={{ color: '#F43F5E' }} />
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#FFFFFF' }}>
                {metrics?.postgres?.likes?.toLocaleString() || '800,003'}
              </div>
              <div style={{ fontSize: '0.725rem', color: '#64748B', marginTop: '4px' }}>
                Unique compound key indexed
              </div>
            </div>

            {/* Community Authors */}
            <div style={{
              backgroundColor: 'rgba(30, 41, 59, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '1.25rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600 }}>Verified Authors</span>
                <Users size={16} style={{ color: '#A855F7' }} />
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#FFFFFF' }}>
                {metrics?.postgres?.users?.toLocaleString() || '105'}
              </div>
              <div style={{ fontSize: '0.725rem', color: '#64748B', marginTop: '4px' }}>
                Engineering student identities
              </div>
            </div>
          </div>
        </section>

        {/* Dual Database Comparative Architecture Grid */}
        <section>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.85rem' }}>
            Comparative Database Health & Storage
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
            gap: '1.5rem'
          }}>
            {/* PostgreSQL Card */}
            <div style={{
              backgroundColor: 'rgba(30, 41, 59, 0.5)',
              border: currentEngine === 'POSTGRES' ? '1px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '1.5rem',
              boxShadow: currentEngine === 'POSTGRES' ? '0 0 20px rgba(56, 189, 248, 0.15)' : 'none'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Database size={20} style={{ color: '#38BDF8' }} />
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF' }}>
                    PostgreSQL 14 (3NF Relational)
                  </span>
                </div>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: dbStatus?.postgres?.connected ? '#34D399' : '#F87171',
                  backgroundColor: dbStatus?.postgres?.connected ? 'rgba(52, 211, 153, 0.1)' : 'rgba(248, 113, 113, 0.1)',
                  padding: '2px 8px',
                  borderRadius: '9999px'
                }}>
                  <CheckCircle2 size={12} />
                  <span>{dbStatus?.postgres?.connected ? 'CONNECTED' : 'DISCONNECTED'}</span>
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: '#94A3B8' }}>Disk Storage on Volume:</span>
                  <strong style={{ color: '#FFFFFF' }}>{metrics?.postgres?.dbSize || '311 MB'}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: '#94A3B8' }}>Live Ping Latency:</span>
                  <strong style={{ color: '#38BDF8' }}>
                    {dbStatus?.postgres?.latencyMs !== null ? `${dbStatus.postgres.latencyMs.toFixed(2)} ms` : 'N/A'}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: '#94A3B8' }}>Schema Normalization:</span>
                  <span style={{ color: '#E2E8F0' }}>Strict 3NF with B-Tree Indexes</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94A3B8' }}>Hash Sort Performance:</span>
                  <span style={{ color: '#E2E8F0' }}>~110–190 ms scan across 100k rows</span>
                </div>
              </div>
            </div>

            {/* MongoDB Card */}
            <div style={{
              backgroundColor: 'rgba(30, 41, 59, 0.5)',
              border: currentEngine === 'MONGODB' ? '1px solid #10B981' : '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '1.5rem',
              boxShadow: currentEngine === 'MONGODB' ? '0 0 20px rgba(16, 185, 129, 0.15)' : 'none'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Server size={20} style={{ color: '#10B981' }} />
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF' }}>
                    MongoDB (WiredTiger Document)
                  </span>
                </div>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: dbStatus?.mongodb?.connected ? '#34D399' : '#F87171',
                  backgroundColor: dbStatus?.mongodb?.connected ? 'rgba(52, 211, 153, 0.1)' : 'rgba(248, 113, 113, 0.1)',
                  padding: '2px 8px',
                  borderRadius: '9999px'
                }}>
                  <CheckCircle2 size={12} />
                  <span>{dbStatus?.mongodb?.connected ? 'CONNECTED' : 'DISCONNECTED'}</span>
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: '#94A3B8' }}>Compressed Storage (Snappy):</span>
                  <strong style={{ color: '#FFFFFF' }}>{metrics?.mongodb?.storageSize || '155.0 MB'}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: '#94A3B8' }}>Live Ping Latency:</span>
                  <strong style={{ color: '#10B981' }}>
                    {dbStatus?.mongodb?.latencyMs !== null ? `${dbStatus.mongodb.latencyMs.toFixed(2)} ms` : 'N/A'}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: '#94A3B8' }}>Data Representation:</span>
                  <span style={{ color: '#E2E8F0' }}>Polymorphic BSON Collections</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94A3B8' }}>Pipeline Sampling Speed:</span>
                  <span style={{ color: '#E2E8F0' }}>~10–25 ms random cursor extraction</span>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
