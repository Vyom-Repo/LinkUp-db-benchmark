import React, { useState, useEffect } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import CreatePostModal from '../components/CreatePostModal';
import api from '../services/api';
import { PlusSquare, RefreshCw, Flame, Clock, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const ACTIVE_STORIES = [
  { username: 'alex_photo', name: 'Alex', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=alex_photo' },
  { username: 'clara_design', name: 'Clara', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=clara_design' },
  { username: 'david_dev', name: 'David', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=david_dev' },
  { username: 'elena_arch', name: 'Elena', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=elena_arch' },
  { username: 'marcus_ai', name: 'Marcus', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=marcus_ai' },
  { username: 'sophia_code', name: 'Sophia', avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=sophia_code' },
];

export default function FeedPage() {
  const { activeEngine } = useDatabase();
  const { user, isAuthenticated } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('latest');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const fetchFeed = async (targetPage = 1, currentSort = sort, append = false) => {
    if (targetPage === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await api.get(`/posts?limit=15&page=${targetPage}&sort=${currentSort}`);
      if (res.data.success) {
        const fetchedPosts = res.data.data.posts;
        if (append) {
          setPosts((prev) => [...prev, ...fetchedPosts]);
        } else {
          setPosts(fetchedPosts);
        }
        setHasMore(fetchedPosts.length === 15);
        setPage(targetPage);
      }
    } catch (err) {
      console.error('Failed to load feed:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

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
    <div className="container" style={{ maxWidth: '520px', paddingTop: '1.25rem', paddingBottom: '4rem' }}>
      
      {/* 1. Instagram Stories Tray */}
      <div 
        className="glass-panel"
        style={{
          padding: '0.85rem 1rem',
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '1rem',
          overflowX: 'auto',
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          border: '1px solid var(--border-color)',
        }}
      >
        {/* Your Story Avatar (Opens create modal) */}
        {isAuthenticated && (
          <div 
            onClick={() => setIsCreateOpen(true)}
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
                src={user?.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.username}`} 
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
                fontSize: '14px',
                fontWeight: 800,
                border: '2px solid #FFFFFF',
              }}>
                +
              </div>
            </div>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-primary)', fontWeight: 600 }}>Your Story</span>
          </div>
        )}

        {/* Stories from creators */}
        {ACTIVE_STORIES.map((s) => (
          <Link
            key={s.username}
            to={`/profile/${s.username}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.35rem',
              textDecoration: 'none',
              flexShrink: 0,
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
          </Link>
        ))}
      </div>

      {/* 2. Top Post Composer Bar & Filter Tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.25rem',
        padding: '0 0.25rem',
      }}>
        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button
            onClick={() => setSort('latest')}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              backgroundColor: sort === 'latest' ? 'var(--text-primary)' : '#EFECE6',
              color: sort === 'latest' ? '#FFFFFF' : 'var(--text-secondary)',
            }}
          >
            Latest
          </button>
          <button
            onClick={() => setSort('liked')}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              backgroundColor: sort === 'liked' ? 'var(--text-primary)' : '#EFECE6',
              color: sort === 'liked' ? '#FFFFFF' : 'var(--text-secondary)',
            }}
          >
            Popular
          </button>
        </div>

        {/* New Post (+) Button */}
        {isAuthenticated && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="btn btn-primary"
            style={{ padding: '0.45rem 0.95rem', fontSize: '0.825rem', borderRadius: 'var(--radius-full)' }}
          >
            <PlusSquare size={16} />
            <span>New Post</span>
          </button>
        )}
      </div>

      {/* 3. The Instagram Posts Feed Stream */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
          <div className="pulse-glow" style={{ fontSize: '1rem', fontWeight: 600 }}>Loading feed...</div>
        </div>
      ) : posts.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', borderRadius: '14px' }}>
          <p style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>No posts yet</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            Be the first to share a moment or thought with the community!
          </p>
          {isAuthenticated && (
            <button 
              onClick={() => setIsCreateOpen(true)} 
              className="btn btn-primary"
              style={{ borderRadius: 'var(--radius-full)' }}
            >
              <PlusSquare size={16} />
              <span>Create First Post</span>
            </button>
          )}
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
                style={{ padding: '0.65rem 2rem', borderRadius: 'var(--radius-full)', fontSize: '0.85rem' }}
              >
                {loadingMore ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onPostCreated={handlePostCreated}
      />

    </div>
  );
}
