import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, Database, Cpu, Layers, ShieldCheck, ArrowRight, Activity } from 'lucide-react';
import { useDatabase } from '../context/DatabaseContext';

export default function HomePage() {
  const { activeEngine } = useDatabase();

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '5rem' }}>
      
      {/* Hero Section */}
      <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto 4rem auto' }}>
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          background: 'rgba(99, 102, 241, 0.1)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          padding: '0.35rem 0.85rem',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.8125rem',
          fontWeight: 600,
          color: '#818cf8',
          marginBottom: '1.5rem'
        }}>
          <Activity size={14} />
          <span>Active Datastore Engine: {activeEngine === 'postgres' ? 'PostgreSQL (Relational)' : 'MongoDB (NoSQL)'}</span>
        </div>

        <h1 style={{ fontSize: '3.5rem', lineHeight: '1.15', marginBottom: '1.25rem', letterSpacing: '-0.03em' }}>
          Where conversations move at the speed of <span style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>engineered data</span>.
        </h1>

        <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '2.5rem' }}>
          Sync is a high-performance social platform built to demonstrate real-time feed indexing, 
          cascading social relationships, and empirical database performance under heavy read/write workloads.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <Link to="/feed" className="btn btn-primary" style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }}>
            <span>Explore Social Feed</span>
            <ArrowRight size={18} />
          </Link>

          <Link to="/admin" className="btn btn-secondary" style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }}>
            <Cpu size={18} />
            <span>Open Database Lab</span>
          </Link>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '1.5rem',
        marginTop: '2rem' 
      }}>
        
        <div className="glass-panel glass-panel-hover" style={{ padding: '1.75rem' }}>
          <div style={{ 
            width: '44px', 
            height: '44px', 
            borderRadius: 'var(--radius-md)', 
            background: 'rgba(51, 103, 145, 0.2)', 
            color: '#60a5fa',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            marginBottom: '1rem' 
          }}>
            <Database size={22} />
          </div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Dynamic Engine Switching</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
            Toggle between PostgreSQL and MongoDB at the global server runtime without interrupting active client sessions or corrupting feed timelines.
          </p>
        </div>

        <div className="glass-panel glass-panel-hover" style={{ padding: '1.75rem' }}>
          <div style={{ 
            width: '44px', 
            height: '44px', 
            borderRadius: 'var(--radius-md)', 
            background: 'rgba(99, 102, 241, 0.2)', 
            color: '#818cf8',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            marginBottom: '1rem' 
          }}>
            <Layers size={22} />
          </div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Deterministic Seed Scaling</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
            Test and benchmark datasets scaled from 1,000 to 1,000,000 rows with identical UUIDs and timestamp distributions across both database engines.
          </p>
        </div>

        <div className="glass-panel glass-panel-hover" style={{ padding: '1.75rem' }}>
          <div style={{ 
            width: '44px', 
            height: '44px', 
            borderRadius: 'var(--radius-md)', 
            background: 'rgba(236, 72, 153, 0.2)', 
            color: '#f472b6',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            marginBottom: '1rem' 
          }}>
            <ShieldCheck size={22} />
          </div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Deep Query Introspection</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
            Direct access to PostgreSQL <code className="code-font">EXPLAIN (ANALYZE, BUFFERS)</code> and MongoDB <code className="code-font">executionStats</code> inside the live Admin Lab.
          </p>
        </div>

      </div>

    </div>
  );
}
