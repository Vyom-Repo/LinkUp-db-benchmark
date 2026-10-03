import React, { useState, useEffect } from 'react';
import { PlusSquare, RefreshCw, Image as ImageIcon, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';

const ACTIVE_STORIES = [
  { username: 'clara_design', name: 'Clara', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=clara_design' },
  { username: 'david_dev', name: 'David', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=david_dev' },
  { username: 'elena_arch', name: 'Elena', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=elena_arch' },
  { username: 'marcus_ai', name: 'Marcus', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=marcus_ai' },
  { username: 'sophia_code', name: 'Sophia', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=sophia_code' },
];

const PHOTO_PRESETS = [
  { label: 'Campus', url: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1000&auto=format&fit=crop&q=80' },
  { label: 'Coffee', url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1000&auto=format&fit=crop&q=80' },
  { label: 'Study Group', url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1000&auto=format&fit=crop&q=80' },
  { label: 'Workspace', url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1000&auto=format&fit=crop&q=80' },
  { label: 'Architecture', url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1000&auto=format&fit=crop&q=80' },
];

export default function FeedPage() {
  const { user, token } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [publishing, setPublishing] = useState(false);

  const fetchFeed = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/posts?limit=25', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setPosts(data.data.posts);
      }
    } catch (err) {
      console.error('Failed to load feed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newContent.trim() || publishing) return;

    setPublishing(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: newContent.trim(),
          imageUrl: newImageUrl.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPosts((prev) => [data.data.post, ...prev]);
        setNewContent('');
        setNewImageUrl('');
        setIsComposerOpen(false);
      } else {
        alert(data.error?.message || 'Failed to publish post.');
      }
    } catch (err) {
      alert('Network error while publishing post.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '520px', paddingTop: '1.25rem', paddingBottom: '4rem' }}>
      
      {/* 1. Stories Tray */}
      <div 
        style={{
          padding: '0.85rem 1rem',
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '1rem',
          overflowX: 'auto',
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        {/* Current Student's Story Trigger */}
        <div 
          onClick={() => setIsComposerOpen(true)}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', flexShrink: 0 }}
        >
          <div style={{
            position: 'relative',
            width: '56px',
            height: '56px',
            borderRadius: 'var(--radius-full)',
            border: '2px dashed var(--primary)',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <img 
              src={user?.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.username || 'user'}`} 
              alt="Your Story"
              style={{ width: '46px', height: '46px', borderRadius: 'var(--radius-full)', objectFit: 'cover' }}
            />
            <div style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              background: 'var(--primary)',
              color: '#fff',
              borderRadius: 'var(--radius-full)',
              width: '18px',
              height: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              fontWeight: 800,
              border: '2px solid #FFFFFF',
            }}>
              +
            </div>
          </div>
          <span style={{ fontSize: '0.725rem', color: 'var(--text-primary)', fontWeight: 600 }}>Your Story</span>
        </div>

        {/* Stories from Fellow Students */}
        {ACTIVE_STORIES.map((s) => (
          <div
            key={s.username}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.35rem',
              flexShrink: 0,
              cursor: 'pointer'
            }}
          >
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
              padding: '2.5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <img 
                src={s.avatar} 
                alt={s.name}
                style={{
                  width: '47px',
                  height: '47px',
                  borderRadius: 'var(--radius-full)',
                  border: '2px solid #FFFFFF',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            </div>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>{s.name}</span>
          </div>
        ))}
      </div>

      {/* 2. Top Feed Bar (New Post Button & Feed Refresh) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.25rem',
        padding: '0 0.25rem',
      }}>
        <div style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
          Student Feed
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={fetchFeed}
            className="btn btn-secondary"
            style={{ padding: '0.45rem 0.65rem', borderRadius: 'var(--radius-full)', fontSize: '0.8rem' }}
            title="Refresh Feed"
          >
            <RefreshCw size={14} />
          </button>

          <button
            onClick={() => setIsComposerOpen(true)}
            className="btn btn-primary"
            style={{ padding: '0.45rem 0.95rem', fontSize: '0.825rem', borderRadius: 'var(--radius-full)' }}
          >
            <PlusSquare size={16} />
            <span>New Post</span>
          </button>
        </div>
      </div>

      {/* 3. Composer Modal */}
      {isComposerOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(28, 25, 23, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem',
        }}>
          <div 
            className="card animate-fade-in"
            style={{
              width: '100%',
              maxWidth: '500px',
              padding: '1.5rem',
              borderRadius: '16px',
              backgroundColor: '#FFFFFF',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <span style={{ fontWeight: 700, fontSize: '1rem' }}>Create New Post</span>
              <button 
                onClick={() => setIsComposerOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreatePost}>
              <textarea
                rows="4"
                required
                placeholder="What's on your mind? Share a thought or update..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="form-input"
                style={{ marginBottom: '1rem', resize: 'none' }}
                autoFocus
              />

              {/* Photo Presets */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <ImageIcon size={14} style={{ color: 'var(--primary)' }} />
                  <span>Attach Photography (Choose Preset or Paste Image URL)</span>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                  {PHOTO_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setNewImageUrl(p.url)}
                      style={{
                        padding: '0.25rem 0.6rem',
                        fontSize: '0.75rem',
                        borderRadius: 'var(--radius-full)',
                        border: newImageUrl === p.url ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                        background: newImageUrl === p.url ? 'var(--primary)' : '#FAF8F5',
                        color: newImageUrl === p.url ? '#FFFFFF' : 'var(--text-primary)',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <input
                  type="url"
                  placeholder="Or paste custom image URL (https://...)"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="form-input"
                  style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem' }}
                />
              </div>

              {/* Preview Image if selected */}
              {newImageUrl && (
                <div style={{ position: 'relative', marginBottom: '1rem', borderRadius: '10px', overflow: 'hidden', maxHeight: '180px' }}>
                  <img src={newImageUrl} alt="Preview" style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                  <button
                    type="button"
                    onClick={() => setNewImageUrl('')}
                    style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', padding: '4px', cursor: 'pointer' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={publishing || !newContent.trim()}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', opacity: publishing ? 0.7 : 1 }}
              >
                {publishing ? 'Publishing...' : 'Share Post'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 4. Posts Feed Stream */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>Loading student feed...</div>
        </div>
      ) : posts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <p style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>No posts yet</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            Be the first to share an update with fellow students!
          </p>
          <button 
            onClick={() => setIsComposerOpen(true)} 
            className="btn btn-primary"
            style={{ borderRadius: 'var(--radius-full)' }}
          >
            <PlusSquare size={16} />
            <span>Create First Post</span>
          </button>
        </div>
      ) : (
        <div>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

    </div>
  );
}
