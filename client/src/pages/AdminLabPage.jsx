import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Cpu, 
  HardDrive, 
  Activity, 
  Layers, 
  Play, 
  RefreshCw, 
  CheckCircle, 
  Sliders, 
  BarChart2, 
  Terminal,
  Zap,
  Server
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { useDatabase } from '../context/DatabaseContext';
import api from '../services/api';

export default function AdminLabPage() {
  const { activeEngine, switchEngine, switching } = useDatabase();
  const [activeTab, setActiveTab] = useState('benchmark'); // 'benchmark', 'telemetry', 'storage', 'explain'

  // Summary & Telemetry State
  const [summary, setSummary] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [storage, setStorage] = useState(null);
  const [loadingTelemetry, setLoadingTelemetry] = useState(false);

  // Explain Query State
  const [explainOp, setExplainOp] = useState('feed');
  const [explainResult, setExplainResult] = useState(null);
  const [loadingExplain, setLoadingExplain] = useState(false);

  // Benchmark Suite State
  const [experiment, setExperiment] = useState('feed_read');
  const [iterations, setIterations] = useState(30);
  const [benchmarkResult, setBenchmarkResult] = useState(null);
  const [runningBenchmark, setRunningBenchmark] = useState(false);

  // Polling / Fetching Telemetry
  const fetchTelemetry = async () => {
    setLoadingTelemetry(true);
    try {
      const [sumRes, metRes, storRes] = await Promise.all([
        api.get('/admin/database/summary'),
        api.get('/admin/metrics'),
        api.get('/admin/storage'),
      ]);
      if (sumRes.data.success) setSummary(sumRes.data.data.counts);
      if (metRes.data.success) setMetrics(metRes.data.data);
      if (storRes.data.success) setStorage(storRes.data.data);
    } catch (e) {
      console.error('Failed to fetch telemetry:', e);
    } finally {
      setLoadingTelemetry(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
  }, [activeEngine]);

  const handleRunExplain = async () => {
    setLoadingExplain(true);
    try {
      const res = await api.post('/admin/explain', { operation: explainOp });
      if (res.data.success) {
        setExplainResult(res.data.data);
      }
    } catch (err) {
      alert('Explain failed: ' + (err.response?.data?.error?.message || err.message));
    } finally {
      setLoadingExplain(false);
    }
  };

  const handleRunBenchmark = async () => {
    setRunningBenchmark(true);
    setBenchmarkResult(null);
    try {
      const res = await api.post('/admin/benchmark/run', {
        experiment,
        iterations: parseInt(iterations, 10) || 30,
        warmupCount: 3,
      });
      if (res.data.success) {
        setBenchmarkResult(res.data.data);
      }
    } catch (err) {
      alert('Benchmark failed: ' + (err.response?.data?.error?.message || err.message));
    } finally {
      setRunningBenchmark(false);
    }
  };

  // Prepare chart data for benchmark
  const chartData = benchmarkResult
    ? [
        {
          metric: 'Mean Latency (ms)',
          PostgreSQL: benchmarkResult.results.postgres.meanMs,
          MongoDB: benchmarkResult.results.mongodb.meanMs,
        },
        {
          metric: 'Median P50 (ms)',
          PostgreSQL: benchmarkResult.results.postgres.medianMs,
          MongoDB: benchmarkResult.results.mongodb.medianMs,
        },
        {
          metric: 'P95 Latency (ms)',
          PostgreSQL: benchmarkResult.results.postgres.p95Ms,
          MongoDB: benchmarkResult.results.mongodb.p95Ms,
        },
        {
          metric: 'Std Dev σ (ms)',
          PostgreSQL: benchmarkResult.results.postgres.stdDevMs,
          MongoDB: benchmarkResult.results.mongodb.stdDevMs,
        },
      ]
    : [];

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '5rem' }}>
      
      {/* Top Header & Engine Switcher Banner */}
      <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
          
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#34d399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Cpu size={18} />
              </div>
              <h1 style={{ fontSize: '1.75rem' }}>Database Analytics & Benchmark Lab</h1>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Comparative SQL vs NoSQL performance study for PostgreSQL and MongoDB under identical workloads.
            </p>
          </div>

          {/* Engine Toggle Buttons */}
          <div style={{ 
            display: 'flex', 
            background: 'rgba(0,0,0,0.4)', 
            padding: '0.35rem', 
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            gap: '0.35rem'
          }}>
            <button
              onClick={() => switchEngine('postgres')}
              disabled={switching}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.625rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.875rem',
                backgroundColor: activeEngine === 'postgres' ? 'var(--postgres-blue)' : 'transparent',
                color: activeEngine === 'postgres' ? '#fff' : 'var(--text-secondary)',
                boxShadow: activeEngine === 'postgres' ? '0 2px 10px var(--postgres-glow)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <Database size={16} />
              <span>PostgreSQL (SQL)</span>
            </button>

            <button
              onClick={() => switchEngine('mongodb')}
              disabled={switching}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.625rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.875rem',
                backgroundColor: activeEngine === 'mongodb' ? '#059669' : 'transparent',
                color: activeEngine === 'mongodb' ? '#fff' : 'var(--text-secondary)',
                boxShadow: activeEngine === 'mongodb' ? '0 2px 10px var(--mongo-glow)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <Database size={16} />
              <span>MongoDB (NoSQL)</span>
            </button>
          </div>

        </div>

        {/* Live Counters Strip */}
        {summary && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
            gap: '1rem', 
            marginTop: '1.5rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border-color)' 
          }}>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Users</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{summary.users?.toLocaleString()}</div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Posts</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{summary.posts?.toLocaleString()}</div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Comments</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{summary.comments?.toLocaleString()}</div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Likes</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{summary.likes?.toLocaleString()}</div>
            </div>
          </div>
        )}
      </div>

      {/* Lab Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('benchmark')}
          className="btn btn-secondary"
          style={{
            backgroundColor: activeTab === 'benchmark' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
            borderColor: activeTab === 'benchmark' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'benchmark' ? '#fff' : 'var(--text-secondary)'
          }}
        >
          <BarChart2 size={16} />
          <span>Scientific Benchmark Suite</span>
        </button>

        <button
          onClick={() => setActiveTab('explain')}
          className="btn btn-secondary"
          style={{
            backgroundColor: activeTab === 'explain' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
            borderColor: activeTab === 'explain' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'explain' ? '#fff' : 'var(--text-secondary)'
          }}
        >
          <Terminal size={16} />
          <span>Query Plan Inspector</span>
        </button>

        <button
          onClick={() => setActiveTab('storage')}
          className="btn btn-secondary"
          style={{
            backgroundColor: activeTab === 'storage' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
            borderColor: activeTab === 'storage' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'storage' ? '#fff' : 'var(--text-secondary)'
          }}
        >
          <HardDrive size={16} />
          <span>Storage Footprint</span>
        </button>

        <button
          onClick={() => setActiveTab('telemetry')}
          className="btn btn-secondary"
          style={{
            backgroundColor: activeTab === 'telemetry' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
            borderColor: activeTab === 'telemetry' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'telemetry' ? '#fff' : 'var(--text-secondary)'
          }}
        >
          <Activity size={16} />
          <span>System Telemetry</span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: SCIENTIFIC BENCHMARK SUITE */}
      {/* ============================================================ */}
      {activeTab === 'benchmark' && (
        <div>
          {/* Benchmark Controls Card */}
          <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sliders size={18} style={{ color: 'var(--primary)' }} />
              <span>Experiment Configuration</span>
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Target Operation
                </label>
                <select
                  value={experiment}
                  onChange={(e) => setExperiment(e.target.value)}
                  className="form-input"
                  style={{ background: '#0f172a' }}
                >
                  <option value="feed_read">Feed Read (LIMIT 20 + Author Join / Lookup)</option>
                  <option value="search">Full-Text Search (GIN vs Text Index)</option>
                  <option value="single_insert">Single Insert (Write Latency)</option>
                  <option value="aggregation">Aggregation (Top 5 Engaged Posts)</option>
                  <option value="point_update">Point Update (Post Edit)</option>
                  <option value="like_toggle">Like Toggle & Counter Update</option>
                  <option value="cascade_delete">Cascade Delete (Post + 50 Comments + 100 Likes)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Repetition Iterations
                </label>
                <select
                  value={iterations}
                  onChange={(e) => setIterations(e.target.value)}
                  className="form-input"
                  style={{ background: '#0f172a' }}
                >
                  <option value="10">10 iterations (Instant)</option>
                  <option value="30">30 iterations (Balanced sample)</option>
                  <option value="50">50 iterations (Standard academic test)</option>
                  <option value="100">100 iterations (High statistical confidence)</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button
                  onClick={handleRunBenchmark}
                  disabled={runningBenchmark}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.75rem' }}
                >
                  <Play size={16} />
                  <span>{runningBenchmark ? 'Executing Experiment...' : 'Run Benchmark'}</span>
                </button>
              </div>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Execution order between PostgreSQL and MongoDB is automatically randomized to eliminate CPU thermal throttling or page cache bias.
            </div>
          </div>

          {/* Benchmark Results Display */}
          {runningBenchmark && (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem', marginBottom: '2rem' }}>
              <div className="pulse-glow" style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Executing {iterations} rounds against PostgreSQL & MongoDB...
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Executing warmups, recording monotonic timestamps via performance.now(), and calculating standard deviation σ.
              </p>
            </div>
          )}

          {benchmarkResult && (
            <div className="animate-fade-in">
              
              {/* Summary Card */}
              <div className="glass-panel" style={{ 
                padding: '1.5rem', 
                marginBottom: '1.5rem',
                borderLeft: '4px solid var(--primary)',
                background: 'rgba(99, 102, 241, 0.05)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Comparative Outcome
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '0.25rem' }}>
                      {benchmarkResult.comparison.summary}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem' }}>
                    <div className="badge-engine-postgres">PostgreSQL Order: {benchmarkResult.engineOrder.indexOf('postgres') + 1}</div>
                    <div className="badge-engine-mongodb">MongoDB Order: {benchmarkResult.engineOrder.indexOf('mongodb') + 1}</div>
                  </div>
                </div>
              </div>

              {/* Chart Visualization */}
              <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '1.25rem' }}>Latency Metrics Comparison (Lower is Faster)</h4>
                
                <div style={{ width: '100%', height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EDE8DF" />
                      <XAxis dataKey="metric" stroke="#57534E" fontSize={12} />
                      <YAxis stroke="#57534E" fontSize={12} unit="ms" />
                      <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E6E1D8', borderRadius: '8px', color: '#1C1917', boxShadow: '0 4px 12px rgba(44,39,32,0.08)' }} />
                      <Legend />
                      <Bar dataKey="PostgreSQL" fill="#1E3A5F" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="MongoDB" fill="#166534" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Statistical Table */}
              <div className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto' }}>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Statistical Metrics Distribution</h4>
                
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.75rem' }}>Database Engine</th>
                      <th style={{ padding: '0.75rem' }}>Mean (Avg)</th>
                      <th style={{ padding: '0.75rem' }}>Median (P50)</th>
                      <th style={{ padding: '0.75rem' }}>P95 Tail</th>
                      <th style={{ padding: '0.75rem' }}>P99 Tail</th>
                      <th style={{ padding: '0.75rem' }}>Std Dev (σ)</th>
                      <th style={{ padding: '0.75rem' }}>Throughput (ops/sec)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 700, color: '#60a5fa' }}>PostgreSQL (3NF)</td>
                      <td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>{benchmarkResult.results.postgres.meanMs} ms</td>
                      <td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>{benchmarkResult.results.postgres.medianMs} ms</td>
                      <td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>{benchmarkResult.results.postgres.p95Ms} ms</td>
                      <td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>{benchmarkResult.results.postgres.p99Ms} ms</td>
                      <td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>±{benchmarkResult.results.postgres.stdDevMs} ms</td>
                      <td style={{ padding: '0.75rem', fontFamily: 'monospace', color: '#34d399', fontWeight: 700 }}>
                        {benchmarkResult.results.postgres.throughputOpsSec}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '0.75rem', fontWeight: 700, color: 'var(--mongo-green)' }}>MongoDB (NoSQL)</td>
                      <td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>{benchmarkResult.results.mongodb.meanMs} ms</td>
                      <td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>{benchmarkResult.results.mongodb.medianMs} ms</td>
                      <td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>{benchmarkResult.results.mongodb.p95Ms} ms</td>
                      <td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>{benchmarkResult.results.mongodb.p99Ms} ms</td>
                      <td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>±{benchmarkResult.results.mongodb.stdDevMs} ms</td>
                      <td style={{ padding: '0.75rem', fontFamily: 'monospace', color: '#34d399', fontWeight: 700 }}>
                        {benchmarkResult.results.mongodb.throughputOpsSec}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Controlled Metadata Box */}
                <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Controlled Variables Snapshot: Node {benchmarkResult.environment.nodeVersion} • CPU {benchmarkResult.environment.cpuModel} ({benchmarkResult.environment.cpuCores} cores) • OS {benchmarkResult.environment.platform}-{benchmarkResult.environment.arch}
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: QUERY PLAN INSPECTOR */}
      {/* ============================================================ */}
      {activeTab === 'explain' && (
        <div>
          <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>Query Execution Plan Introspection</h3>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <select 
                value={explainOp} 
                onChange={(e) => setExplainOp(e.target.value)} 
                className="form-input" 
                style={{ maxWidth: '320px', background: '#0f172a' }}
              >
                <option value="feed">Feed Query (LIMIT 20 + Sort)</option>
                <option value="search">Search Query ("database" match)</option>
                <option value="top_engaged">Top Engaged Posts (Sort by Likes+Comments)</option>
              </select>

              <button 
                onClick={handleRunExplain} 
                disabled={loadingExplain} 
                className="btn btn-primary"
              >
                <Terminal size={16} />
                <span>{loadingExplain ? 'Analyzing Query...' : `Run EXPLAIN on ${activeEngine.toUpperCase()}`}</span>
              </button>
            </div>
          </div>

          {explainResult && (
            <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ background: 'rgba(0,0,0,0.25)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Execution Duration</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                    {explainResult.executionTimeMs !== undefined ? `${explainResult.executionTimeMs} ms` : `${explainResult.executionTimeMillis} ms`}
                  </div>
                </div>

                {explainResult.engine === 'postgres' ? (
                  <>
                    <div style={{ background: 'rgba(0,0,0,0.25)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Planning Time</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{explainResult.planningTimeMs} ms</div>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.25)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Buffer Shared Hits</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34d399' }}>{explainResult.sharedHitBlocks} blocks</div>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.25)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Primary Node</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{explainResult.primaryNodeType}</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ background: 'rgba(0,0,0,0.25)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Execution Stage</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{explainResult.stage}</div>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.25)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Docs Examined</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{explainResult.totalDocsExamined}</div>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.25)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Keys Examined</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34d399' }}>{explainResult.totalKeysExamined}</div>
                    </div>
                  </>
                )}
              </div>

              {/* Raw JSON Visualizer */}
              <h4 style={{ fontSize: '0.95rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                Raw Execution Statistics ({explainResult.engine.toUpperCase()})
              </h4>
              <pre style={{
                background: '#FAF8F4',
                color: '#1C1917',
                border: '1px solid var(--border-color)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                overflowX: 'auto',
                fontSize: '0.8rem',
                fontFamily: 'JetBrains Mono, monospace',
                maxHeight: '380px'
              }}>
                {JSON.stringify(explainResult.rawPlan || explainResult.rawStats, null, 2)}
              </pre>

            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: STORAGE FOOTPRINT */}
      {/* ============================================================ */}
      {activeTab === 'storage' && storage && (
        <div className="animate-fade-in">
          <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>Physical Storage Comparison</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              
              {/* Active Engine Card */}
              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <h4 style={{ color: '#60a5fa', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                  {storage.active.engine} Storage
                </h4>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                  {storage.active.totalSizeMB} MB
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Total Relation + Index Footprint
                </div>
              </div>

              {/* Comparison Engine Card */}
              {storage.comparison && !storage.comparison.error && (
                <div style={{ background: 'rgba(0,0,0,0.25)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ color: 'var(--mongo-green)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                    {storage.comparison.engine} Storage
                  </h4>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                    {storage.comparison.totalSizeMB} MB
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Total Collection + Index Footprint
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 4: SYSTEM TELEMETRY */}
      {/* ============================================================ */}
      {activeTab === 'telemetry' && metrics && (
        <div className="animate-fade-in">
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>Node.js Runtime & OS Telemetry</h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>V8 Heap Used</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{metrics.process.heapUsedMB} MB</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>V8 Heap Total</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{metrics.process.heapTotalMB} MB</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Process RSS</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{metrics.process.rssMB} MB</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>API Requests Tracked</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{metrics.telemetry.totalRequests}</div>
              </div>
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Host Architecture: {metrics.system.platform}-{metrics.system.arch} • CPU: {metrics.system.cpuModel} ({metrics.system.cpuCores} cores) • Free Memory: {metrics.system.freeMemMB} MB / {metrics.system.totalMemMB} MB
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
