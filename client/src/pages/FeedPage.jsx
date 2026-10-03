import React, { useState, useEffect } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import PostCard from '../components/PostCard';
import CreatePostBox from '../components/CreatePostBox';
import api from '../services/api';
import { Flame, Clock, MessageSquare, TrendingUp, RefreshCw } from 'lucide-react';

export default function FeedPage() {
  const { activeEngine, lastLatencyMs } = useDatabase();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('latest');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [topEngaged, setTopEngaged] = useState([]);

  const fetchFeed = async (targetPage = 1, currentSort = sort, append = false) => {
    if (targetPage === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await api.get(`/posts?limit=20&page=${targetPage}&sort=${currentSort}`);
      if (res.data.success) {
        const fetchedPosts = res.data.data.posts;
        if (append) {
          setPosts((prev) => [...prev, ...fetchedPosts]);
        } else {
          setPosts(fetchedPosts);
        }
        setHasMore(fetchedPosts.length === 20);
        setPage(targetPage);
      }
    } catch (err) {
      console.error('Failed to load feed:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Re-fetch on sort change or when active engine changes!
  useEffect(() => {
    fetchFeed(1, sort, false);
  }, [sort, activeEngine]);

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
  };

  const handlePostDeleted = (postId) => {
    setPosts(posts.filter((p) => p.id !== postId));
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchFeed(page + 1, sort, true);
    }
  };

  return (
    <div className="container">
      <div className="content-grid">
        
        {/* Left Sidebar: Navigation & Quick Filters */}
        <aside className="sidebar-left">
          <div className="glass-panel" style={{ padding: '1.25rem', position: 'sticky', top: '5rem' }}>
            <h4 style={{ fontSize: '0.95rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
              Feed Feeds
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                onClick={() => setSort('latest')}
                className="btn btn-secondary"
                style={{
                  justifyContent: 'flex-start',
                  backgroundColor: sort === 'latest' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  borderColor: sort === 'latest' ? 'var(--primary)' : 'transparent',
                  color: sort === 'latest' ? '#fff' : 'var(--text-secondary)'
                }}
              >
                <Clock size={16} />
                <span>Chronological Feed</span>
              </button>

              <button
                onClick={() => setSort('liked')}
                className="btn btn-secondary"
                style={{
                  justifyContent: 'flex-start',
                  backgroundColor: sort === 'liked' ? 'rgba(236, 72, 153, 0.15)' : 'transparent',
                  borderColor: sort === 'liked' ? '#ec4899' : 'transparent',
                  color: sort === 'liked' ? '#f472b6' : 'var(--text-secondary)'
                }}
              >
                <Flame size={16} />
                <span>Most Liked</span>
              </button>

              <button
                onClick={() => setSort('commented')}
                className="btn btn-secondary"
                style={{
                  justifyContent: 'flex-start',
                  backgroundColor: sort === 'commented' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                  borderColor: sort === 'commented' ? '#06b6d4' : 'transparent',
                  color: sort === 'commented' ? '#22d3ee' : 'var(--text-secondary)'
                }}
              >
                <MessageSquare size={16} />
                <span>Most Discussed</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Center: Main Stream */}
        <main>
          <CreatePostBox onPostCreated={handlePostCreated} />

          {/* Header Bar with Latency */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.25rem' }}>
                {sort === 'latest' ? 'Recent Posts' : sort === 'liked' ? 'Trending by Likes' : 'Top Discussions'}
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                ({posts.length} visible)
              </span>
            </div>

            <button 
              onClick={() => fetchFeed(1, sort, false)} 
              className="btn btn-secondary" 
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
              title="Refresh Feed"
            >
              <RefreshCw size={13} className={loading ? 'pulse-glow' : ''} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Feed Content */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
              <div className="pulse-glow" style={{ fontSize: '1.1rem', fontWeight: 600 }}>Loading posts from {activeEngine}...</div>
            </div>
          ) : posts.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No posts found in this feed view.</p>
              <p style={{ fontSize: '0.9rem' }}>Be the first to create a post or seed the database from the Admin Lab!</p>
            </div>
          ) : (
            <div>
              {posts.map((post) => (
                <PostCard key={post.id} post={post} onPostDeleted={handlePostDeleted} />
              ))}

              {hasMore && (
                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                  <button 
                    onClick={loadMore} 
                    disabled={loadingMore}
                    className="btn btn-secondary"
                    style={{ padding: '0.75rem 2rem' }}
                  >
                    {loadingMore ? 'Fetching older posts...' : 'Load More Posts'}
                  </button>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Right Sidebar: Active Database Telemetry Card */}
        <aside className="sidebar-right">
          <div className="glass-panel" style={{ padding: '1.25rem', position: 'sticky', top: '5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <TrendingUp size={18} style={{ color: 'var(--primary)' }} />
              <h4 style={{ fontSize: '0.95rem' }}>Engine Telemetry</h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ 
                background: 'rgba(0,0,0,0.25)', 
                padding: '0.75rem', 
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active Datastore</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: activeEngine === 'postgres' ? '#60a5fa' : 'var(--mongo-green)' }}>
                  {activeEngine === 'postgres' ? 'PostgreSQL (3NF)' : 'MongoDB (BSON)'}
                </div>
              </div>

              <div style={{ 
                background: 'rgba(0,0,0,0.25)', 
                padding: '0.75rem', 
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Roundtrip Latency</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}>
                  {lastLatencyMs !== null ? `${lastLatencyMs} ms` : '—'}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              Feed queries dynamically route to the selected database engine while maintaining identical post UUIDs.
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}
