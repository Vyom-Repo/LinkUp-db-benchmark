import React, { useState } from 'react';
import { Search as SearchIcon, Database, Zap, Clock } from 'lucide-react';
import { useDatabase } from '../context/DatabaseContext';
import PostCard from '../components/PostCard';
import api from '../services/api';

export default function SearchPage() {
  const { activeEngine } = useDatabase();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [executionTimeMs, setExecutionTimeMs] = useState(null);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const res = await api.get(`/search?q=${encodeURIComponent(searchTerm.trim())}&limit=20`);
      if (res.data.success) {
        setResults(res.data.data.posts);
        setExecutionTimeMs(res.data.meta?.searchExecutionTimeMs || null);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '800px', paddingTop: '2rem', paddingBottom: '4rem' }}>
      
      {/* Search Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>Full-Text Index Search</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Querying inverted indexes in real-time:{' '}
          <strong style={{ color: activeEngine === 'postgres' ? '#60a5fa' : 'var(--mongo-green)' }}>
            {activeEngine === 'postgres' ? 'PostgreSQL GIN tsvector Index' : 'MongoDB Text Index'}
          </strong>
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} style={{ marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          padding: '0.5rem 0.75rem',
          gap: '0.75rem',
          boxShadow: 'var(--shadow-glow)'
        }}>
          <SearchIcon size={20} style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }} />
          <input
            type="text"
            placeholder="Search keywords (e.g. database, indexing, relational, latency)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
            style={{ 
              border: 'none', 
              background: 'transparent', 
              boxShadow: 'none', 
              fontSize: '1.05rem',
              padding: '0.5rem 0'
            }}
          />
          <button type="submit" disabled={loading || !searchTerm.trim()} className="btn btn-primary">
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {/* Performance Summary Banner */}
      {searched && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          marginBottom: '1.5rem',
          padding: '0.75rem 1rem',
          background: 'rgba(0,0,0,0.3)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          fontSize: '0.85rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Matches Found:</span>
            <strong>{results.length} posts</strong>
          </div>

          {executionTimeMs !== null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#34d399', fontFamily: 'JetBrains Mono, monospace' }}>
              <Zap size={14} />
              <span>Query Execution: {executionTimeMs} ms</span>
            </div>
          )}
        </div>
      )}

      {/* Results List */}
      <div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
            <div className="pulse-glow">Executing inverted index scan on {activeEngine}...</div>
          </div>
        ) : searched && results.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No matching posts found for "{searchTerm}".</p>
            <p style={{ fontSize: '0.9rem' }}>Try searching for common benchmark tokens like "database", "relational", or "NoSQL".</p>
          </div>
        ) : (
          results.map((post) => (
            <PostCard key={post.id} post={post} />
          ))
        )}
      </div>

    </div>
  );
}
