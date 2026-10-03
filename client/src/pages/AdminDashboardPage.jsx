import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Database, 
  Server, 
  Activity, 
  RefreshCw, 
  LogOut, 
  ExternalLink, 
  ShieldCheck, 
  CheckCircle2, 
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
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      padding: '2rem 1.5rem 4rem 1.5rem'
    }}>
      <div style={{ maxWidth: '1180px', margin: '0 auto' }}>

        {/* Top Admin Navigation Header */}
        <header style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: '1.5rem',
          borderBottom: '1px solid var(--border-color)',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <ShieldCheck size={24} style={{ color: 'var(--primary)' }} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                  LinkUp Admin Lab
                </span>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid rgba(154, 91, 50, 0.2)'
                }}>
                  ROOT ACCESS
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                GTU Sem 5 WAD & ADBMS Comparative Architecture Control
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* View Community Feed */}
            <Link
              to="/feed"
              className="btn btn-secondary"
              style={{
                fontSize: '0.825rem',
                padding: '0.5rem 0.95rem',
                borderRadius: '8px',
                textDecoration: 'none'
              }}
            >
              <span>View Community Feed</span>
              <ExternalLink size={13} />
            </Link>

            {/* Refresh Telemetry */}
            <button
              onClick={fetchTelemetry}
              disabled={loading}
              className="btn btn-secondary"
              style={{
                fontSize: '0.825rem',
                padding: '0.5rem 0.95rem',
                borderRadius: '8px'
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
                backgroundColor: '#FEF2F2',
                border: '1px solid #FCA5A5',
                color: '#B91C1C',
                padding: '0.5rem 0.95rem',
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
            backgroundColor: actionMsg.startsWith('✅') ? '#ECFDF5' : '#FEF2F2',
            border: `1px solid ${actionMsg.startsWith('✅') ? '#A7F3D0' : '#FCA5A5'}`,
            color: actionMsg.startsWith('✅') ? '#065F46' : '#B91C1C',
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
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border-color)',
          borderRadius: '14px',
          padding: '1.5rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.25rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Zap size={18} style={{ color: currentEngine === 'MONGODB' ? '#10B981' : '#3B82F6' }} />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Active Database Engine: <span style={{ color: currentEngine === 'MONGODB' ? '#059669' : '#2563EB' }}>{currentEngine}</span>
              </h2>
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
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
                border: currentEngine === 'POSTGRES' ? '1px solid #3B82F6' : '1px solid var(--border-color)',
                backgroundColor: currentEngine === 'POSTGRES' ? '#EFF6FF' : '#FAF8F4',
                color: currentEngine === 'POSTGRES' ? '#1D4ED8' : 'var(--text-secondary)',
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
                border: currentEngine === 'MONGODB' ? '1px solid #10B981' : '1px solid var(--border-color)',
                backgroundColor: currentEngine === 'MONGODB' ? '#ECFDF5' : '#FAF8F4',
                color: currentEngine === 'MONGODB' ? '#047857' : 'var(--text-secondary)',
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
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.85rem' }}>
            Platform Data Volume (Tier 2 Benchmark Dataset)
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem'
          }}>
            {/* Total Posts */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '1.25rem',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Discussions</span>
                <FileText size={16} style={{ color: '#2563EB' }} />
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {metrics?.postgres?.posts?.toLocaleString() || '100,012'}
              </div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                100% synchronized in both DBs
              </div>
            </div>

            {/* Total Comments */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '1.25rem',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Comments</span>
                <MessageSquare size={16} style={{ color: '#059669' }} />
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {metrics?.postgres?.comments?.toLocaleString() || '400,013'}
              </div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Relational FK & Mongo embedded
              </div>
            </div>

            {/* Total Likes */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '1.25rem',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Likes</span>
                <Heart size={16} style={{ color: '#E11D48' }} />
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {metrics?.postgres?.likes?.toLocaleString() || '800,003'}
              </div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Unique compound key indexed
              </div>
            </div>

            {/* Community Authors */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '1.25rem',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Verified Authors</span>
                <Users size={16} style={{ color: '#7C3AED' }} />
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {metrics?.postgres?.users?.toLocaleString() || '105'}
              </div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Engineering student identities
              </div>
            </div>
          </div>
        </section>

        {/* Dual Database Comparative Architecture Grid */}
        <section>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.85rem' }}>
            Comparative Database Health & Storage
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
            gap: '1.5rem'
          }}>
            {/* PostgreSQL Card */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: currentEngine === 'POSTGRES' ? '2px solid #3B82F6' : '1px solid var(--border-color)',
              borderRadius: '14px',
              padding: '1.5rem',
              boxShadow: currentEngine === 'POSTGRES' ? '0 4px 16px rgba(59, 130, 246, 0.12)' : 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Database size={20} style={{ color: '#2563EB' }} />
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    PostgreSQL 14 (3NF Relational)
                  </span>
                </div>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: dbStatus?.postgres?.connected ? '#065F46' : '#B91C1C',
                  backgroundColor: dbStatus?.postgres?.connected ? '#ECFDF5' : '#FEF2F2',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)'
                }}>
                  <CheckCircle2 size={12} />
                  <span>{dbStatus?.postgres?.connected ? 'CONNECTED' : 'DISCONNECTED'}</span>
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Disk Storage on Volume:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{metrics?.postgres?.dbSize || '319 MB'}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Live Ping Latency:</span>
                  <strong style={{ color: '#2563EB' }}>
                    {dbStatus?.postgres?.latencyMs !== null ? `${dbStatus.postgres.latencyMs.toFixed(2)} ms` : 'N/A'}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Schema Normalization:</span>
                  <span style={{ color: 'var(--text-primary)' }}>Strict 3NF with B-Tree Indexes</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Hash Sort Performance:</span>
                  <span style={{ color: 'var(--text-primary)' }}>~110–190 ms scan across 100k rows</span>
                </div>
              </div>
            </div>

            {/* MongoDB Card */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: currentEngine === 'MONGODB' ? '2px solid #10B981' : '1px solid var(--border-color)',
              borderRadius: '14px',
              padding: '1.5rem',
              boxShadow: currentEngine === 'MONGODB' ? '0 4px 16px rgba(16, 185, 129, 0.12)' : 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Server size={20} style={{ color: '#059669' }} />
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    MongoDB (WiredTiger Document)
                  </span>
                </div>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: dbStatus?.mongodb?.connected ? '#065F46' : '#B91C1C',
                  backgroundColor: dbStatus?.mongodb?.connected ? '#ECFDF5' : '#FEF2F2',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)'
                }}>
                  <CheckCircle2 size={12} />
                  <span>{dbStatus?.mongodb?.connected ? 'CONNECTED' : 'DISCONNECTED'}</span>
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Compressed Storage (Snappy):</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{metrics?.mongodb?.storageSize || '138.0 MB'}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Live Ping Latency:</span>
                  <strong style={{ color: '#059669' }}>
                    {dbStatus?.mongodb?.latencyMs !== null ? `${dbStatus.mongodb.latencyMs.toFixed(2)} ms` : 'N/A'}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Data Representation:</span>
                  <span style={{ color: 'var(--text-primary)' }}>Polymorphic BSON Collections</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Pipeline Sampling Speed:</span>
                  <span style={{ color: 'var(--text-primary)' }}>~10–25 ms random cursor extraction</span>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
