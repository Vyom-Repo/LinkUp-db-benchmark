import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Home, 
  Compass, 
  Search, 
  User as UserIcon, 
  Calendar, 
  Edit3, 
  X, 
  MessageSquare, 
  Heart, 
  FileText, 
  Mail, 
  Check, 
  AlertCircle,
  PlusCircle,
  Activity,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  UploadCloud,
  Link as LinkIcon,
  Image as ImageIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';

const AVATAR_PRESETS = [
  'https://api.dicebear.com/7.x/identicon/svg?seed=tech',
  'https://api.dicebear.com/7.x/identicon/svg?seed=alex',
  'https://api.dicebear.com/7.x/identicon/svg?seed=sam',
  'https://api.dicebear.com/7.x/identicon/svg?seed=dev',
  'https://api.dicebear.com/7.x/identicon/svg?seed=code',
];

export default function ProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, token, updateUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' | 'about'

  // Edit Profile Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [editError, setEditError] = useState(null);

  // Create Post Modal State (Dual-Database Execution)
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImageUrl, setNewPostImageUrl] = useState('');
  const [showNewPostUrlInput, setShowNewPostUrlInput] = useState(false);
  const [publishingPost, setPublishingPost] = useState(false);
  const [createPostError, setCreatePostError] = useState(null);
  const postFileInputRef = useRef(null);

  const fetchProfile = async (uname) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/users/${uname}?_t=${Date.now()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setProfile(data.data);
      } else {
        setError(data.error?.message || `User @${uname} not found.`);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
      setError('Unable to load profile. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (username) {
      fetchProfile(username);
    }
  }, [username, token]);

  const handleOpenEditModal = () => {
    if (!profile) return;
    setEditName(profile.name || '');
    setEditBio(profile.bio || '');
    setEditAvatarUrl(profile.avatar_url || '');
    setEditError(null);
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      setEditError('Full name cannot be blank.');
      return;
    }

    setSavingProfile(true);
    setEditError(null);

    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editName.trim(),
          bio: editBio.trim(),
          avatarUrl: editAvatarUrl.trim() || null,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const updatedUser = data.data.user;
        
        // Update profile in local state
        setProfile((prev) => ({
          ...prev,
          name: updatedUser.name,
          bio: updatedUser.bio,
          avatar_url: updatedUser.avatarUrl,
        }));

        // Synchronize AuthContext so Navbar and Feed update seamlessly
        updateUser({
          name: updatedUser.name,
          bio: updatedUser.bio,
          avatarUrl: updatedUser.avatarUrl,
        });

        setIsEditModalOpen(false);
      } else {
        setEditError(data.error?.message || 'Failed to update profile.');
      }
    } catch (err) {
      console.error('Update profile error:', err);
      setEditError('An unexpected network error occurred.');
    } finally {
      setSavingProfile(false);
    }
  };

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
        setNewPostImageUrl(optimizedDataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
    if (postFileInputRef.current) postFileInputRef.current.value = '';
  };

  const handleCreateProfilePost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim() || publishingPost) return;

    setPublishingPost(true);
    setCreatePostError(null);

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: newPostContent.trim(),
          imageUrl: newPostImageUrl.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Dual-written in PostgreSQL & MongoDB; prepend to profile posts view
        setProfile((prev) => ({
          ...prev,
          posts: [data.data.post, ...(prev.posts || [])],
          stats: {
            ...prev.stats,
            posts: (prev.stats?.posts || 0) + 1,
          },
        }));

        setNewPostContent('');
        setNewPostImageUrl('');
        setShowNewPostUrlInput(false);
        setIsCreatePostModalOpen(false);
        setActiveTab('posts');
      } else {
        setCreatePostError(data.error?.message || 'Failed to create post.');
      }
    } catch (err) {
      console.error('Error creating post:', err);
      setCreatePostError('Network error while publishing post.');
    } finally {
      setPublishingPost(false);
    }
  };

  const handlePostDeleted = (deletedPostId) => {
    setProfile((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        posts: prev.posts.filter((p) => p.id !== deletedPostId),
        stats: {
          ...prev.stats,
          posts: Math.max(0, (prev.stats?.posts || 1) - 1),
        },
      };
    });
  };

  const formatJoinedDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return `Joined ${d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}`;
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '3rem 1rem', display: 'flex', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '3px solid var(--border-color)',
            borderTopColor: 'var(--primary)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Loading profile...</span>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="container" style={{ padding: '3.5rem 1rem', maxWidth: '640px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          padding: '2.5rem 1.5rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <AlertCircle size={44} style={{ color: '#dc2626', margin: '0 auto 1rem auto' }} />
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            User Not Found
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            {error || `The user @${username} does not exist on LinkUp.`}
          </p>
          <button 
            onClick={() => navigate('/feed')}
            className="btn btn-primary"
            style={{ padding: '0.55rem 1.25rem', borderRadius: 'var(--radius-md)' }}
          >
            <ArrowLeft size={16} />
            <span>Back to Feed</span>
          </button>
        </div>
      </div>
    );
  }

  const isOwnProfile = profile.is_own_profile;
  const avatarSrc = profile.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${profile.username}`;

  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: 'calc(100vh - 65px)', padding: '1.5rem 0 3rem 0' }}>
      <div className="container">
        
        {/* 3-COLUMN DESKTOP GRID */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '240px 1fr 280px',
          gap: '1.5rem',
          alignItems: 'start'
        }}>

          {/* ────────────────────────────────────────────── */}
          {/* COLUMN 1: LEFT NAVIGATION                      */}
          {/* ────────────────────────────────────────────── */}
          <aside style={{ position: 'sticky', top: '5.2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '1.25rem 1rem',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ fontSize: '0.725rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.75rem', paddingLeft: '0.5rem' }}>
                Navigation
              </div>

              <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <Link 
                  to="/feed"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F2EFE9'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Home size={17} />
                  <span>Home Feed</span>
                </Link>

                <button 
                  onClick={() => navigate('/explore')}
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
                  <Compass size={17} />
                  <span>Explore</span>
                </button>

                <div style={{ margin: '0.5rem 0', height: '1px', backgroundColor: 'var(--border-color)' }} />

                <div style={{ fontSize: '0.725rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.4rem', paddingLeft: '0.5rem' }}>
                  Identity
                </div>

                <Link 
                  to={`/profile/${currentUser?.username}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    backgroundColor: isOwnProfile ? 'var(--primary-light)' : 'transparent',
                    color: isOwnProfile ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: isOwnProfile ? 700 : 600,
                    fontSize: '0.875rem',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  <UserIcon size={17} />
                  <span>My Profile</span>
                </Link>
              </nav>
            </div>

            {/* Quick Back to Discussions */}
            <button 
              onClick={() => navigate('/feed')}
              className="btn btn-secondary"
              style={{
                width: '100%',
                padding: '0.6rem 0.75rem',
                fontSize: '0.85rem',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <ArrowLeft size={15} />
              <span>Back to Feed</span>
            </button>
          </aside>

          {/* ────────────────────────────────────────────── */}
          {/* COLUMN 2: CENTER PROFILE HEADER & CONTENT      */}
          {/* ────────────────────────────────────────────── */}
          <main style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* 1. PROFESSIONAL PROFILE HEADER CARD */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid var(--border-color)',
              padding: '1.75rem',
              boxShadow: 'var(--shadow-sm)',
              position: 'relative'
            }}>
              
              {/* Profile Top Row: Avatar & Identity & Action Button */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1.25rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flex: 1, minWidth: '240px' }}>
                  <img 
                    src={avatarSrc} 
                    alt={profile.name} 
                    style={{
                      width: '84px',
                      height: '84px',
                      borderRadius: '16px',
                      objectFit: 'cover',
                      border: '2px solid var(--border-color)',
                      backgroundColor: '#FAF8F5',
                      boxShadow: '0 4px 12px rgba(44, 39, 32, 0.06)'
                    }}
                  />

                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <h1 style={{ fontSize: '1.45rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', lineHeight: 1.2 }}>
                        {profile.name}
                      </h1>
                      {profile.is_admin && (
                        <span 
                          title="Verified Administrator"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.2rem',
                            backgroundColor: '#FEF3C7',
                            color: '#92400E',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.45rem',
                            borderRadius: 'var(--radius-full)'
                          }}
                        >
                          <ShieldCheck size={12} />
                          Admin
                        </span>
                      )}
                    </div>

                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '2px' }}>
                      @{profile.username}
                    </span>

                    <p style={{
                      fontSize: '0.925rem',
                      color: profile.bio ? 'var(--text-primary)' : 'var(--text-muted)',
                      fontStyle: profile.bio ? 'normal' : 'italic',
                      marginTop: '0.5rem',
                      lineHeight: 1.45,
                      maxWidth: '520px'
                    }}>
                      {profile.bio || 'Building things with code and databases.'}
                    </p>
                  </div>
                </div>

                {/* Own Profile Actions */}
                {isOwnProfile && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <button 
                      onClick={() => setIsCreatePostModalOpen(true)}
                      className="btn btn-primary"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        padding: '0.55rem 1rem',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        borderRadius: '8px',
                      }}
                    >
                      <PlusCircle size={15} />
                      <span>Create Post</span>
                    </button>

                    <button 
                      onClick={handleOpenEditModal}
                      className="btn btn-secondary"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        padding: '0.55rem 1rem',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        borderRadius: '8px',
                        backgroundColor: '#FFFFFF',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-primary)',
                        boxShadow: 'var(--shadow-sm)'
                      }}
                    >
                      <Edit3 size={15} />
                      <span>Edit Profile</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Joined Date Badge */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                marginTop: '1.25rem',
                paddingTop: '0.85rem',
                borderTop: '1px solid #F2EEE6'
              }}>
                <Calendar size={14} />
                <span>{formatJoinedDate(profile.created_at)}</span>
              </div>

              {/* CALCULATED DATABASE STATISTICS ROW */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.75rem',
                marginTop: '1rem',
                backgroundColor: '#FAF8F4',
                padding: '0.85rem 1rem',
                borderRadius: '12px',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                    {profile.stats?.posts || 0}
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Posts
                  </div>
                </div>

                <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                    {profile.stats?.comments || 0}
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Comments
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                    {profile.stats?.likes_received || 0}
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Likes Received
                  </div>
                </div>
              </div>

            </div>

            {/* 2. PROFILE NAVIGATION TABS */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              borderBottom: '2px solid var(--border-color)',
              padding: '0 0.5rem'
            }}>
              <button 
                onClick={() => setActiveTab('posts')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 0.25rem',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: activeTab === 'posts' ? 'var(--primary)' : 'var(--text-secondary)',
                  borderBottom: activeTab === 'posts' ? '2px solid var(--primary)' : '2px solid transparent',
                  marginBottom: '-2px',
                  transition: 'all 0.15s ease'
                }}
              >
                <FileText size={17} />
                <span>Posts</span>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  backgroundColor: activeTab === 'posts' ? 'var(--primary-light)' : '#EAE6DC',
                  color: activeTab === 'posts' ? 'var(--primary)' : 'var(--text-secondary)',
                  padding: '0.1rem 0.45rem',
                  borderRadius: 'var(--radius-full)'
                }}>
                  {profile.stats?.posts || 0}
                </span>
              </button>

              <button 
                onClick={() => setActiveTab('about')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 0.25rem',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: activeTab === 'about' ? 'var(--primary)' : 'var(--text-secondary)',
                  borderBottom: activeTab === 'about' ? '2px solid var(--primary)' : '2px solid transparent',
                  marginBottom: '-2px',
                  transition: 'all 0.15s ease'
                }}
              >
                <UserIcon size={17} />
                <span>About</span>
              </button>
            </div>

            {/* 3. TAB CONTENT: POSTS */}
            {activeTab === 'posts' && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {profile.posts && profile.posts.length > 0 ? (
                  profile.posts.map((post) => (
                    <PostCard 
                      key={post.id} 
                      post={post} 
                      onPostDeleted={handlePostDeleted} 
                    />
                  ))
                ) : (
                  /* 5. EMPTY PROFILE STATE */
                  <div style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1px solid var(--border-color)',
                    padding: '3.5rem 1.5rem',
                    textAlign: 'center',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}>
                    <div style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      backgroundColor: '#FAF8F4',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-muted)',
                      marginBottom: '0.25rem'
                    }}>
                      <FileText size={26} />
                    </div>

                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      No posts yet
                    </h3>

                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '360px', lineHeight: 1.5 }}>
                      {isOwnProfile ? 'Share something with LinkUp.' : `@${profile.username} hasn't published any discussions yet.`}
                    </p>

                    {isOwnProfile && (
                      <button
                        onClick={() => setIsCreatePostModalOpen(true)}
                        className="btn btn-primary"
                        style={{
                          marginTop: '0.5rem',
                          padding: '0.55rem 1.25rem',
                          fontSize: '0.85rem',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.45rem'
                        }}
                      >
                        <PlusCircle size={15} />
                        <span>Create Post</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 4. TAB CONTENT: ABOUT */}
            {activeTab === 'about' && (
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid var(--border-color)',
                padding: '1.75rem',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem'
              }}>
                <div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                    About {profile.name}
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Community identity and platform statistics
                  </p>
                </div>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  overflow: 'hidden'
                }}>
                  {/* Username Row */}
                  <div style={{ display: 'flex', padding: '0.85rem 1rem', borderBottom: '1px solid #F0ECE4', backgroundColor: '#FFFFFF' }}>
                    <span style={{ width: '140px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Username
                    </span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      @{profile.username}
                    </span>
                  </div>

                  {/* Email Row (STRICT PRIVACY: ONLY ON OWN PROFILE) */}
                  {isOwnProfile && profile.email && (
                    <div style={{ display: 'flex', padding: '0.85rem 1rem', borderBottom: '1px solid #F0ECE4', backgroundColor: '#FAF8F4' }}>
                      <span style={{ width: '140px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        Email
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Mail size={14} style={{ color: 'var(--text-muted)' }} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {profile.email}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#16a34a', backgroundColor: '#DCFCE7', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>
                          Private to you
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Joined Date */}
                  <div style={{ display: 'flex', padding: '0.85rem 1rem', borderBottom: '1px solid #F0ECE4', backgroundColor: '#FFFFFF' }}>
                    <span style={{ width: '140px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Joined
                    </span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {formatJoinedDate(profile.created_at)}
                    </span>
                  </div>

                  {/* Posts Published */}
                  <div style={{ display: 'flex', padding: '0.85rem 1rem', borderBottom: '1px solid #F0ECE4', backgroundColor: '#FAF8F4' }}>
                    <span style={{ width: '140px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Posts
                    </span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {profile.stats?.posts || 0}
                    </span>
                  </div>

                  {/* Comments Published */}
                  <div style={{ display: 'flex', padding: '0.85rem 1rem', borderBottom: '1px solid #F0ECE4', backgroundColor: '#FFFFFF' }}>
                    <span style={{ width: '140px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Comments
                    </span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {profile.stats?.comments || 0}
                    </span>
                  </div>

                  {/* Likes Received */}
                  <div style={{ display: 'flex', padding: '0.85rem 1rem', backgroundColor: '#FAF8F4' }}>
                    <span style={{ width: '140px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Likes Received
                    </span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {profile.stats?.likes_received || 0}
                    </span>
                  </div>
                </div>

                {/* Bio Summary Section */}
                <div style={{
                  padding: '1rem',
                  backgroundColor: '#FAF8F4',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
                    Bio
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    {profile.bio || 'No bio provided yet.'}
                  </p>
                </div>
              </div>
            )}

          </main>

          {/* ────────────────────────────────────────────── */}
          {/* COLUMN 3: RIGHT ACTIVITY & COMMUNITY WIDGET    */}
          {/* ────────────────────────────────────────────── */}
          <aside style={{ position: 'sticky', top: '5.2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* 10. SPECIFIC LINKUP FEATURE: ACTIVITY CARD */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '1.25rem',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Activity size={17} style={{ color: 'var(--primary)' }} />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                  {isOwnProfile ? 'Your LinkUp Activity' : `${profile.name}'s Activity`}
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #F2EEE6' }}>
                  <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>Posts published</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {profile.stats?.posts || 0}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #F2EEE6' }}>
                  <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>Comments posted</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {profile.stats?.comments || 0}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0' }}>
                  <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>Likes received</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#16a34a' }}>
                    {profile.stats?.likes_received || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Platform Trust & Quality Guidelines */}
            <div style={{
              backgroundColor: '#FAF8F4',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Professional Identity
              </span>
              <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                LinkUp is built for meaningful technical exchanges, questions, and insights without vanity metrics or photo algorithms.
              </p>
            </div>

          </aside>

        </div>

      </div>

      {/* ────────────────────────────────────────────── */}
      {/* 6. EDIT PROFILE MODAL                          */}
      {/* ────────────────────────────────────────────── */}
      {isEditModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(28, 25, 23, 0.45)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            width: '100%',
            maxWidth: '480px',
            boxShadow: 'var(--shadow-lg)',
            overflow: 'hidden',
            animation: 'fadeIn 0.15s ease'
          }}>
            
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border-color)',
              backgroundColor: '#FAF8F4'
            }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Edit Profile
              </h2>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveProfile} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              
              {editError && (
                <div style={{
                  padding: '0.65rem 0.85rem',
                  backgroundColor: '#FEE2E2',
                  border: '1px solid #FCA5A5',
                  borderRadius: '8px',
                  fontSize: '0.825rem',
                  color: '#991B1B'
                }}>
                  {editError}
                </div>
              )}

              {/* Avatar Preview & Options */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.45rem' }}>
                  Avatar
                </label>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <img 
                    src={editAvatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${profile.username}`} 
                    alt="Preview" 
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '12px',
                      objectFit: 'cover',
                      border: '2px solid var(--border-color)',
                      backgroundColor: '#FAF8F5'
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <input 
                      type="url"
                      placeholder="Paste avatar image URL..."
                      value={editAvatarUrl}
                      onChange={(e) => setEditAvatarUrl(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem',
                        fontSize: '0.825rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        outline: 'none',
                        backgroundColor: '#FFFFFF',
                        color: 'var(--text-primary)'
                      }}
                    />
                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Presets:</span>
                      {AVATAR_PRESETS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setEditAvatarUrl(preset)}
                          style={{
                            border: editAvatarUrl === preset ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                            padding: '1px',
                            borderRadius: '6px',
                            background: '#FAF8F5',
                            cursor: 'pointer'
                          }}
                        >
                          <img src={preset} alt="preset" style={{ width: '20px', height: '20px', borderRadius: '4px' }} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Name Input */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                  Name
                </label>
                <input 
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    fontSize: '0.875rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    outline: 'none',
                    backgroundColor: '#FFFFFF',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              {/* Username Input (Read-only initially as specified) */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Username
                  </label>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                    (Read-only)
                  </span>
                </div>
                <input 
                  type="text"
                  disabled
                  value={`@${profile.username}`}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    fontSize: '0.875rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: '#F7F5F0',
                    color: 'var(--text-muted)',
                    cursor: 'not-allowed'
                  }}
                />
              </div>

              {/* Bio Input */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Bio
                  </label>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                    {editBio.length}/250
                  </span>
                </div>
                <textarea 
                  rows={3}
                  maxLength={250}
                  placeholder="Share a short summary about yourself, what you are building, or your technical interests..."
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    fontSize: '0.875rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    outline: 'none',
                    backgroundColor: '#FFFFFF',
                    color: 'var(--text-primary)',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                marginTop: '0.5rem',
                paddingTop: '0.85rem',
                borderTop: '1px solid var(--border-color)'
              }}>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={savingProfile}
                  className="btn btn-secondary"
                  style={{ padding: '0.55rem 1.15rem', fontSize: '0.85rem', borderRadius: '8px' }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="btn btn-primary"
                  style={{
                    padding: '0.55rem 1.25rem',
                    fontSize: '0.85rem',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem'
                  }}
                >
                  {savingProfile ? (
                    <>
                      <div style={{
                        width: '14px',
                        height: '14px',
                        border: '2px solid rgba(255,255,255,0.4)',
                        borderTopColor: '#FFFFFF',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite'
                      }} />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check size={15} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────── */}
      {/* 7. CREATE POST MODAL (DUAL-DB PERSISTENCE)     */}
      {/* ────────────────────────────────────────────── */}
      {isCreatePostModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(28, 25, 23, 0.45)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            width: '100%',
            maxWidth: '520px',
            boxShadow: 'var(--shadow-lg)',
            overflow: 'hidden',
            animation: 'fadeIn 0.15s ease'
          }}>
            {/* Hidden File Input for uploading from PC */}
            <input 
              type="file" 
              accept="image/*" 
              ref={postFileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleFileSelect} 
            />

            {/* Modal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border-color)',
              backgroundColor: '#FAF8F4'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <PlusCircle size={18} style={{ color: 'var(--primary)' }} />
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Create Discussion
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsCreatePostModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleCreateProfilePost} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {createPostError && (
                <div style={{
                  padding: '0.65rem 0.85rem',
                  backgroundColor: '#FEE2E2',
                  border: '1px solid #FCA5A5',
                  borderRadius: '8px',
                  fontSize: '0.825rem',
                  color: '#991B1B'
                }}>
                  {createPostError}
                </div>
              )}

              {/* Author Info Pill */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <img 
                  src={avatarSrc} 
                  alt={profile.name} 
                  style={{ width: '34px', height: '34px', borderRadius: '8px', border: '1px solid var(--border-color)', objectFit: 'cover' }}
                />
                <div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', lineHeight: 1.2 }}>
                    {profile.name}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Posting to LinkUp Community
                  </span>
                </div>
              </div>

              {/* Discussion Textarea */}
              <textarea
                rows={4}
                required
                autoFocus
                placeholder="What technical insights, question, or update would you like to share?"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 0.85rem',
                  fontSize: '0.925rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  outline: 'none',
                  backgroundColor: '#FAF9F6',
                  color: 'var(--text-primary)',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />

              {/* Attached Image Preview */}
              {newPostImageUrl && (
                <div style={{
                  position: 'relative',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: '1px solid var(--border-color)',
                  backgroundColor: '#000',
                  maxHeight: '220px'
                }}>
                  <img 
                    src={newPostImageUrl} 
                    alt="Attachment Preview" 
                    style={{ width: '100%', maxHeight: '220px', objectFit: 'contain', display: 'block' }}
                  />
                  <button
                    type="button"
                    onClick={() => setNewPostImageUrl('')}
                    style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      background: 'rgba(28, 25, 23, 0.75)',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '50%',
                      padding: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Remove attachment"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* URL Input Toggle */}
              {showNewPostUrlInput && (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input 
                    type="url"
                    placeholder="Paste image web URL (https://...)"
                    value={newPostImageUrl}
                    onChange={(e) => setNewPostImageUrl(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      fontSize: '0.825rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      outline: 'none',
                      backgroundColor: '#FFFFFF',
                      color: 'var(--text-primary)'
                    }}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowNewPostUrlInput(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Media Attachment Options */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '0.75rem',
                borderTop: '1px solid #F0ECE4'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => postFileInputRef.current?.click()}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      background: 'none',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: '0.35rem 0.65rem',
                      borderRadius: '6px',
                      backgroundColor: '#FAF8F4'
                    }}
                    title="Select image from your computer"
                  >
                    <UploadCloud size={14} style={{ color: 'var(--primary)' }} />
                    <span>Upload from PC</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowNewPostUrlInput(!showNewPostUrlInput)}
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
                  >
                    <LinkIcon size={14} />
                    <span>Image URL</span>
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <button
                    type="button"
                    onClick={() => setIsCreatePostModalOpen(false)}
                    disabled={publishingPost}
                    className="btn btn-secondary"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', borderRadius: '8px' }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={publishingPost || !newPostContent.trim()}
                    className="btn btn-primary"
                    style={{
                      padding: '0.5rem 1.25rem',
                      fontSize: '0.85rem',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      opacity: publishingPost || !newPostContent.trim() ? 0.6 : 1
                    }}
                  >
                    {publishingPost ? (
                      <>
                        <div style={{
                          width: '14px',
                          height: '14px',
                          border: '2px solid rgba(255,255,255,0.4)',
                          borderTopColor: '#FFFFFF',
                          borderRadius: '50%',
                          animation: 'spin 0.8s linear infinite'
                        }} />
                        <span>Publishing...</span>
                      </>
                    ) : (
                      <>
                        <PlusCircle size={15} />
                        <span>Publish Post</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
