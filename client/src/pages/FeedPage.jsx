import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Home, 
  Compass, 
  Search, 
  User, 
  TrendingUp, 
  RefreshCw, 
  Image as ImageIcon, 
  X, 
  Activity,
  Layers,
  UploadCloud,
  Link as LinkIcon
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
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [latencyMs, setLatencyMs] = useState(null);
  
  // Inline Composer State
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);

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

  // Helper to optimize and convert an image File/Blob into a crisp, lightweight Data URL
  const processImageFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 960;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setImageUrl(optimizedDataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  // 1. File Selection from PC
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
    // reset input so same file can be re-selected if removed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 2. Clipboard Paste Handler (Ctrl+V / Cmd+V screenshot paste)
  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          processImageFile(file);
          break;
        }
      }
    }
  };

  // 3. Drag and Drop Handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processImageFile(file);
    }
  };

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
        setShowUrlInput(false);
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
                onClick={() => user?.username && navigate(`/profile/${user.username}`)}
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
                  width: '100%',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F2EFE9'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <User size={17} />
                <span>My Profile</span>
              </button>
            </nav>
          </div>

          {/* Quick User Summary Card */}
          <div 
            onClick={() => user?.username && navigate(`/profile/${user.username}`)}
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '1rem',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease, border-color 0.15s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FAF8F4'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
            title="View your profile"
          >
            <img 
              src={user?.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.username || 'user'}`}
              alt={user?.name}
              style={{ width: '38px', height: '38px', borderRadius: '8px', border: '1px solid var(--border-color)', objectFit: 'cover' }}
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

          {/* Persistent Discussion Composer (with PC Upload & Paste Support) */}
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
              backgroundColor: '#FFFFFF',
              border: isDragging ? '2px dashed var(--primary)' : '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '1.25rem',
              marginBottom: '1.25rem',
              boxShadow: 'var(--shadow-sm)',
              transition: 'border-color 0.2s ease',
            }}
          >
            {/* Hidden File Input for PC upload */}
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleFileSelect} 
            />

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
                  placeholder={`What's on your mind, ${user?.name?.split(' ')[0] || 'there'}? Write a discussion, question, or paste an image (Ctrl+V)...`}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onPaste={handlePaste}
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

              {/* Attached Image Preview from PC or URL */}
              {imageUrl && (
                <div style={{ 
                  position: 'relative', 
                  marginBottom: '0.85rem', 
                  marginLeft: '46px', 
                  borderRadius: '10px', 
                  overflow: 'hidden', 
                  border: '1px solid var(--border-color)',
                  maxHeight: '260px',
                  backgroundColor: '#000'
                }}>
                  <img 
                    src={imageUrl} 
                    alt="Attached preview" 
                    style={{ width: '100%', maxHeight: '260px', objectFit: 'contain', display: 'block' }} 
                  />
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    style={{ 
                      position: 'absolute', 
                      top: '8px', 
                      right: '8px', 
                      background: 'rgba(28, 25, 23, 0.75)', 
                      color: '#fff', 
                      border: 'none', 
                      borderRadius: '50%', 
                      padding: '5px', 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Remove attachment"
                  >
                    <X size={15} />
                  </button>
                  <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '8px',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    color: '#fff',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.725rem'
                  }}>
                    Image attached from PC
                  </div>
                </div>
              )}

              {/* Optional URL Input if user prefers pasting web URL */}
              {showUrlInput && (
                <div style={{ marginBottom: '0.75rem', paddingLeft: '46px' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input 
                      type="url"
                      placeholder="Paste image web URL (https://...)"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="form-input"
                      style={{ fontSize: '0.8rem', padding: '0.45rem 0.75rem' }}
                    />
                    <button 
                      type="button" 
                      onClick={() => { setShowUrlInput(false); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Bottom Actions Row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: '46px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {/* Upload from PC Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      background: 'none',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      fontSize: '0.825rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: '0.35rem 0.7rem',
                      borderRadius: '6px',
                      backgroundColor: '#FAF8F4'
                    }}
                    title="Select image from your computer"
                  >
                    <UploadCloud size={15} style={{ color: 'var(--primary)' }} />
                    <span>Upload from PC</span>
                  </button>

                  {/* Paste URL toggle */}
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      padding: '0.35rem 0.5rem',
                      borderRadius: '6px'
                    }}
                    title="Or link via Image URL"
                  >
                    <LinkIcon size={14} />
                    <span>Image URL</span>
                  </button>
                </div>

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
