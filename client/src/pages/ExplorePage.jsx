import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Compass, 
  Home, 
  Search, 
  User, 
  TrendingUp, 
  Clock, 
  Heart, 
  MessageSquare, 
  Activity, 
  Flame, 
  X, 
  ChevronRight, 
  Sparkles,
  ArrowRight,
  Hash
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';

const TRENDING_TOPICS = [
  { tag: 'MongoDB', count: '2.4K discussions', query: 'MongoDB' },
  { tag: 'PostgreSQL', count: '1.8K discussions', query: 'PostgreSQL' },
  { tag: 'React', count: '1.2K discussions', query: 'React' },
  { tag: 'WebDevelopment', count: '934 discussions', query: 'WebDevelopment' },
  { tag: 'DatabaseOptimization', count: '721 discussions', query: 'Optimization' },
  { tag: 'SystemDesign', count: '580 discussions', query: 'SystemDesign' },
  { tag: 'ACID', count: '410 discussions', query: 'ACID' },
];

export default function ExplorePage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Search & Filter State
  const initialQuery = searchParams.get('q') || '';
  const initialSort = searchParams.get('sort') || 'trending';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeSort, setActiveSort] = useState(initialSort); // 'trending' | 'latest' | 'liked' | 'discussed'
  
  // Data State
  const [posts, setPosts] = useState([]);
  const [popularDiscussions, setPopularDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(null);
  const [latencyMs, setLatencyMs] = useState(null);
  const [currentEngine, setCurrentEngine] = useState('POSTGRES');

  const searchInputRef = useRef(null);

  // Fetch Popular Discussions Spotlight
  const fetchPopularSpotlight = async () => {
    try {
      const res = await fetch('/api/posts/popular', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.data?.discussions) {
        setPopularDiscussions(data.data.discussions);
      }
    } catch (err) {
      console.error('Failed to load popular discussions:', err);
    }
  };

  // Fetch Explore Feed Posts
  const fetchExplorePosts = async (targetPage = 1, append = false, queryTerm = searchQuery, sortTerm = activeSort) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    const t0 = performance.now();
    try {
      const params = new URLSearchParams({
        limit: '15',
        page: targetPage.toString(),
        sort: sortTerm,
      });

      if (queryTerm && queryTerm.trim()) {
        params.append('q', queryTerm.trim());
      }

      const res = await fetch(`/api/posts?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
        },
      });

      const t1 = performance.now();
      setLatencyMs(Math.round(t1 - t0));

      const data = await res.json();
      if (data.success) {
        const fetchedPosts = data.data.posts || [];
        if (append) {
          setPosts((prev) => [...prev, ...fetchedPosts]);
        } else {
          setPosts(fetchedPosts);
        }

        setPage(targetPage);
        setHasMore(data.data.hasMore ?? fetchedPosts.length === 15);
        setTotalCount(data.data.totalCount ?? null);
        if (data.data.engine) {
          setCurrentEngine(data.data.engine);
        }
      }
    } catch (err) {
      console.error('Failed to load explore posts:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Initial Load & URL Param synchronization
  useEffect(() => {
    if (token) {
      fetchPopularSpotlight();
      fetchExplorePosts(1, false, initialQuery, initialSort);
    }
  }, [token]);

  // Handle Search Submission
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setSearchParams({ q: searchQuery, sort: activeSort });
    fetchExplorePosts(1, false, searchQuery, activeSort);
  };

  // Clear Search
  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchParams({ sort: activeSort });
    fetchExplorePosts(1, false, '', activeSort);
  };

  // Filter Chip Click
  const handleSortChange = (newSort) => {
    setActiveSort(newSort);
    const newParams = { sort: newSort };
    if (searchQuery) newParams.q = searchQuery;
    setSearchParams(newParams);
    fetchExplorePosts(1, false, searchQuery, newSort);
  };

  // Click on Trending Topic
  const handleTopicClick = (topicQuery) => {
    setSearchQuery(topicQuery);
    setSearchParams({ q: topicQuery, sort: activeSort });
    fetchExplorePosts(1, false, topicQuery, activeSort);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Load More Handler
  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    fetchExplorePosts(page + 1, true, searchQuery, activeSort);
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
        {/* COLUMN 1: NAVIGATION & USER SPACE              */}
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
                onClick={() => navigate('/feed')}
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
                  transition: 'background-color 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F2EFE9'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Home size={17} />
                <span>Your Feed</span>
              </button>

              <button 
                onClick={() => {}}
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
                <Compass size={17} />
                <span>Explore</span>
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

          {/* Quick User Identity Card */}
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
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FAF8F4'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
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
        {/* COLUMN 2: MAIN EXPLORE & DISCOVERY STREAM      */}
        {/* ────────────────────────────────────────────── */}
        <main style={{ minWidth: 0 }}>
          
          {/* Header Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: '1.25rem',
            padding: '0 0.25rem'
          }}>
            <div>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Compass size={24} style={{ color: 'var(--primary)' }} />
                <span>Explore LinkUp</span>
              </h1>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
                Discover trending topics, technical debates, and popular engineering discussions
              </p>
            </div>

            {latencyMs !== null && (
              <div 
                title="Active database engine & live round-trip latency"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: currentEngine === 'MONGODB' ? '#047857' : '#1d4ed8',
                  backgroundColor: currentEngine === 'MONGODB' ? '#ECFDF5' : '#EFF6FF',
                  border: `1px solid ${currentEngine === 'MONGODB' ? '#A7F3D0' : '#BFDBFE'}`,
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-full)'
                }}
              >
                <Activity size={12} style={{ color: currentEngine === 'MONGODB' ? '#10b981' : '#3b82f6' }} />
                <span>LinkUp ({currentEngine}) · {latencyMs} ms</span>
              </div>
            )}
          </div>

          {/* Search Box */}
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '0.65rem 0.85rem',
            marginBottom: '1rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Search size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <input 
                ref={searchInputRef}
                type="text"
                placeholder="Search discussions, topics, or keywords (e.g. MongoDB, PostgreSQL, React, Indexing)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  width: '100%',
                  fontSize: '0.9rem',
                  color: 'var(--text-primary)'
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '2px'
                  }}
                  title="Clear search"
                >
                  <X size={16} />
                </button>
              )}
              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  padding: '0.4rem 1rem',
                  fontSize: '0.8rem',
                  borderRadius: 'var(--radius-md)',
                  flexShrink: 0
                }}
              >
                Search
              </button>
            </form>
          </div>

          {/* Search Active Notification Badge */}
          {searchQuery && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#FAF8F4',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '0.5rem 0.85rem',
              marginBottom: '1rem',
              fontSize: '0.825rem'
            }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Searching for: </span>
                <strong style={{ color: 'var(--text-primary)' }}>"{searchQuery}"</strong>
                {totalCount !== null && (
                  <span style={{ marginLeft: '0.5rem', color: 'var(--primary)', fontWeight: 700 }}>
                    ({totalCount.toLocaleString()} {totalCount === 1 ? 'discussion' : 'discussions'} found)
                  </span>
                )}
              </div>
              <button 
                onClick={handleClearSearch}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.775rem',
                  textDecoration: 'underline'
                }}
              >
                Reset search
              </button>
            </div>
          )}

          {/* Explore Filter Tabs */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            overflowX: 'auto',
            paddingBottom: '0.35rem',
            marginBottom: '1.25rem'
          }}>
            <button
              onClick={() => handleSortChange('trending')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.9rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.825rem',
                fontWeight: activeSort === 'trending' ? 700 : 500,
                border: activeSort === 'trending' ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                backgroundColor: activeSort === 'trending' ? 'var(--primary)' : '#FFFFFF',
                color: activeSort === 'trending' ? '#FFFFFF' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <Flame size={14} />
              <span>Trending</span>
            </button>

            <button
              onClick={() => handleSortChange('latest')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.9rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.825rem',
                fontWeight: activeSort === 'latest' ? 700 : 500,
                border: activeSort === 'latest' ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                backgroundColor: activeSort === 'latest' ? 'var(--primary)' : '#FFFFFF',
                color: activeSort === 'latest' ? '#FFFFFF' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <Clock size={14} />
              <span>Latest</span>
            </button>

            <button
              onClick={() => handleSortChange('liked')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.9rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.825rem',
                fontWeight: activeSort === 'liked' ? 700 : 500,
                border: activeSort === 'liked' ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                backgroundColor: activeSort === 'liked' ? 'var(--primary)' : '#FFFFFF',
                color: activeSort === 'liked' ? '#FFFFFF' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <Heart size={14} />
              <span>Most Liked</span>
            </button>

            <button
              onClick={() => handleSortChange('discussed')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.9rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.825rem',
                fontWeight: activeSort === 'discussed' ? 700 : 500,
                border: activeSort === 'discussed' ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                backgroundColor: activeSort === 'discussed' ? 'var(--primary)' : '#FFFFFF',
                color: activeSort === 'discussed' ? '#FFFFFF' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <MessageSquare size={14} />
              <span>Most Discussed</span>
            </button>
          </div>

          {/* Posts Stream */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>Loading explore discussions...</div>
            </div>
          ) : posts.length === 0 ? (
            /* Empty State */
            <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#FAF8F4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                <Search size={22} style={{ color: 'var(--text-muted)' }} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                No discussions found
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem', maxWidth: '380px', margin: '0 auto 1.25rem auto' }}>
                Try searching for another topic or keyword like <strong>MongoDB</strong>, <strong>PostgreSQL</strong>, or <strong>React</strong>.
              </p>
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.825rem', padding: '0.45rem 1rem' }}
                >
                  Clear search query
                </button>
              )}
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

              {/* Controlled Pagination / Load More Button */}
              {hasMore && (
                <div style={{ textAlign: 'center', marginTop: '1.5rem', marginBottom: '2rem' }}>
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="btn btn-secondary"
                    style={{
                      padding: '0.65rem 1.75rem',
                      fontSize: '0.85rem',
                      borderRadius: 'var(--radius-full)',
                      fontWeight: 600,
                      backgroundColor: '#FFFFFF',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    {loadingMore ? 'Loading more discussions...' : 'Load more discussions ↓'}
                  </button>
                </div>
              )}
            </div>
          )}

        </main>

        {/* ────────────────────────────────────────────── */}
        {/* COLUMN 3: RIGHT PANEL (TOPICS & SPOTLIGHT)     */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
              <TrendingUp size={16} style={{ color: 'var(--primary)' }} />
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                Trending Topics
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {TRENDING_TOPICS.map((item) => (
                <div
                  key={item.tag}
                  onClick={() => handleTopicClick(item.query)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.55rem 0.65rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FAF8F4'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Hash size={14} style={{ color: 'var(--primary)', opacity: 0.8 }} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {item.tag}
                      </span>
                      <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                        {item.count}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                </div>
              ))}
            </div>
          </div>

          {/* Popular Discussions Spotlight Card */}
          {popularDiscussions.length > 0 && (
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '1.25rem',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
                <Flame size={16} style={{ color: '#E06D53' }} />
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                  Popular Discussions
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {popularDiscussions.map((disc, idx) => (
                  <div 
                    key={disc.id}
                    style={{
                      paddingBottom: idx < popularDiscussions.length - 1 ? '0.75rem' : '0',
                      borderBottom: idx < popularDiscussions.length - 1 ? '1px solid var(--border-color)' : 'none'
                    }}
                  >
                    <p style={{
                      fontSize: '0.825rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      lineHeight: 1.35,
                      marginBottom: '0.35rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {disc.content}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                      <span>{disc.like_count} likes · {disc.comment_count} comments</span>
                      <span 
                        onClick={() => handleTopicClick(disc.content.split(' ')[0] || 'Database')}
                        style={{ color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
                      >
                        Join →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </aside>

      </div>
    </div>
  );
}
