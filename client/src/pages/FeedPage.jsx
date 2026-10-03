import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Compass, 
  Search, 
  Bookmark, 
  User, 
  TrendingUp, 
  Sparkles, 
  RefreshCw, 
  Image as ImageIcon, 
  X, 
  CheckCircle2,
  Activity,
  Layers,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';

const TRENDING_TOPICS = [
  { tag: 'PostgreSQL', count: '1.2k discussions' },
  { tag: 'MongoDB', count: '980 discussions' },
  { tag: 'WebDevelopment', count: '740 discussions' },
  { tag: 'DatabaseOptimization', count: '512 discussions' },
  { tag: 'React', count: '430 discussions' },
  { tag: 'SystemDesign', count: '390 discussions' },
];

export default function FeedPage() {
  const { user, token, logout } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [latencyMs, setLatencyMs] = useState(null);
  
  // Inline Composer State
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const fetchFeed = async (showFullLoading = true) => {
    if (showFullLoading) setLoading(true);
    setRefreshing(true);
    const t0 = performance.now();
    try {
      const res = await fetch(`/api/posts?limit=30&_t=${Date.now()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      });
      const t1 = performance.now();
      setLatencyMs(Math.round(t1 - t0));

      const data = await res.json();
      if (data.success) {
        setPosts(data.data.posts);
      }
    } catch (err) {
      console.error('Failed to load feed:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchFeed(true);
    }
  }, [token]);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!content.trim() || publishing) return;

    setPublishing(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: content.trim(),
          imageUrl: imageUrl.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPosts((prev) => [data.data.post, ...prev]);
        setContent('');
        setImageUrl('');
        setShowImageInput(false);
        fetchFeed(false);
      } else {
        alert(data.error?.message || 'Failed to publish post.');
      }
    } catch (err) {
      alert('Network error while publishing discussion.');
    } finally {
      setPublishing(false);
    }
  };

  const handlePostDeleted = (deletedId) => {
    setPosts((prev) => prev.filter((p) => p.id !== deletedId));
  };

  return (
    <div className="container" style={{ paddingTop: '1.75rem', paddingBottom: '4rem' }}>
      
      {/* Three Column Grid Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '240px 1fr 290px',
        gap: '1.75rem',
        alignItems: 'start'
      }}>

        {/* ────────────────────────────────────────────── */}
        {/* COLUMN 1: LEFT NAVIGATION & USER SPACE         */}
        {/* ────────────────────────────────────────────── */}
        <aside style={{ position: 'sticky', top: '80px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Main Navigation Card */}
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1.15rem 0.85rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 0.65rem 0.5rem 0.65rem' }}>
              Feeds
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <button 
                onClick={() => fetchFeed(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '8px',
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary)',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%'
                }}
              >
                <Home size={17} />
                <span>Your Feed</span>
              </button>

              <button 
                onClick={() => alert('Explore discussions across categories')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '8px',
                  backgroundColor: 'transparent',
                  color: 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%'
                }}
              >
                <Compass size={17} />
                <span>Explore Topics</span>
              </button>

              <button 
                onClick={() => alert('Search across all posts and community members')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '8px',
                  backgroundColor: 'transparent',
                  color: 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%'
                }}
              >
                <Search size={17} />
                <span>Search</span>
              </button>
            </nav>

            <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '0.85rem 0' }} />

            <div style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 0.65rem 0.5rem 0.65rem' }}>
              Your Space
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <button 
                onClick={() => alert(`Profile for ${user?.name}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '8px',
                  backgroundColor: 'transparent',
                  color: 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%'
                }}
              >
                <User size={17} />
                <span>My Profile</span>
              </button>

              <button 
                onClick={() => alert('Your saved posts collection')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '8px',
                  backgroundColor: 'transparent',
                  color: 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%'
                }}
              >
                <Bookmark size={17} />
                <span>Saved Discussions</span>
              </button>
            </nav>
          </div>

          {/* Quick User Summary Card */}
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1rem',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <img 
              src={user?.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.username || 'user'}`}
              alt={user?.name}
              style={{ width: '38px', height: '38px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                @{user?.username}
              </span>
            </div>
          </div>

        </aside>

        {/* ────────────────────────────────────────────── */}
        {/* COLUMN 2: CENTER COMMUNITY FEED & COMPOSER     */}
        {/* ────────────────────────────────────────────── */}
        <main style={{ minWidth: 0 }}>
          
          {/* Header Bar with Subtle Latency Indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
            padding: '0 0.25rem'
          }}>
            <div>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
                Your Feed
              </h1>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Community discussions, questions, and technical insights
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              
              {/* Subtle Live Latency Indicator */}
              {latencyMs !== null && (
                <div 
                  title="Measured round-trip API latency for this query"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    backgroundColor: '#FAF8F4',
                    border: '1px solid var(--border-color)',
                    padding: '0.3rem 0.65rem',
                    borderRadius: 'var(--radius-full)'
                  }}
                >
                  <Activity size={12} style={{ color: '#16a34a' }} />
                  <span>LinkUp · {latencyMs} ms</span>
                </div>
              )}

              {/* Refresh Button */}
              <button
                onClick={() => fetchFeed(false)}
                disabled={refreshing}
                className="btn btn-secondary"
                style={{
                  padding: '0.4rem 0.75rem',
                  fontSize: '0.8rem',
                  borderRadius: 'var(--radius-full)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <RefreshCw 
                  size={13} 
                  style={{
                    animation: refreshing ? 'spin 0.75s linear infinite' : 'none',
                  }} 
                />
                <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            </div>
          </div>

          {/* Persistent Discussion Composer (LinkedIn-Style) */}
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1.25rem',
            marginBottom: '1.25rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <form onSubmit={handleCreatePost}>
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <img 
                  src={user?.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.username || 'user'}`}
                  alt={user?.name}
                  style={{ width: '38px', height: '38px', borderRadius: '8px', border: '1px solid var(--border-color)', flexShrink: 0 }}
                />
                <textarea
                  rows="3"
                  required
                  placeholder={`What's on your mind, ${user?.name?.split(' ')[0] || 'there'}? Start a technical discussion or question...`}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="form-input"
                  style={{
                    border: '1px solid var(--border-color)',
                    backgroundColor: '#FAF9F6',
                    resize: 'none',
                    fontSize: '0.925rem',
                    padding: '0.65rem 0.85rem'
                  }}
                />
              </div>

              {/* Optional Photo Attachment Input */}
              {showImageInput && (
                <div style={{ marginBottom: '0.75rem', paddingLeft: '46px' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input 
                      type="url"
                      placeholder="Paste image URL (optional)"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="form-input"
                      style={{ fontSize: '0.8rem', padding: '0.45rem 0.75rem' }}
                    />
                    <button 
                      type="button" 
                      onClick={() => { setShowImageInput(false); setImageUrl(''); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Bottom Actions Row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: '46px' }}>
                <button
                  type="button"
                  onClick={() => setShowImageInput(!showImageInput)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    fontSize: '0.825rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: '0.35rem 0.5rem',
                    borderRadius: '6px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FAF8F4'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <ImageIcon size={16} style={{ color: 'var(--primary)' }} />
                  <span>{showImageInput ? 'Cancel Photo' : 'Add Photo'}</span>
                </button>

                <button
                  type="submit"
                  disabled={publishing || !content.trim()}
                  className="btn btn-primary"
                  style={{
                    padding: '0.45rem 1.35rem',
                    fontSize: '0.85rem',
                    borderRadius: 'var(--radius-md)',
                    opacity: publishing || !content.trim() ? 0.6 : 1
                  }}
                >
                  {publishing ? 'Posting...' : 'Post'}
                </button>
              </div>
            </form>
          </div>

          {/* Posts Feed Stream */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>Loading community discussions...</div>
            </div>
          ) : posts.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
              <p style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>No discussions yet</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Start the very first discussion with the community!
              </p>
            </div>
          ) : (
            <div>
              {posts.map((post) => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  onPostDeleted={handlePostDeleted}
                />
              ))}
            </div>
          )}

        </main>

        {/* ────────────────────────────────────────────── */}
        {/* COLUMN 3: RIGHT PANEL (TRENDING & STATS)       */}
        {/* ────────────────────────────────────────────── */}
        <aside style={{ position: 'sticky', top: '80px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Trending Topics Card */}
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <TrendingUp size={16} style={{ color: 'var(--primary)' }} />
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                Trending Topics
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {TRENDING_TOPICS.map((t) => (
                <div 
                  key={t.tag}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    padding: '0.35rem 0.4rem',
                    borderRadius: '6px',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FAF8F4'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    #{t.tag}
                  </span>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                    {t.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Your Activity & Community Stats Card */}
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
              <Layers size={16} style={{ color: 'var(--primary)' }} />
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                Your Activity
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
              <div style={{ backgroundColor: '#FAF8F4', padding: '0.65rem 0.35rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {posts.filter(p => p.author_id === user?.id).length}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Posts</div>
              </div>

              <div style={{ backgroundColor: '#FAF8F4', padding: '0.65rem 0.35rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {posts.reduce((acc, p) => acc + (p.is_liked_by_me ? 1 : 0), 0)}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Likes</div>
              </div>

              <div style={{ backgroundColor: '#FAF8F4', padding: '0.65rem 0.35rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {posts.length}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Feed</div>
              </div>
            </div>

            <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              LinkUp v1.0 • GTU Sem 5 WAD & ADBMS
            </div>
          </div>

        </aside>

      </div>
    </div>
  );
}
