import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function PostCard({ post, onPostDeleted }) {
  const { user, isAuthenticated } = useAuth();
  const [liked, setLiked] = useState(post.is_liked_by_me || false);
  const [likeCount, setLikeCount] = useState(post.like_count || 0);
  const [commentCount, setCommentCount] = useState(post.comment_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [heartAnim, setHeartAnim] = useState(false);

  const canDelete = user && (user.id === post.author_id || user.isAdmin);

  const toggleLike = async () => {
    if (!isAuthenticated) {
      alert('Please log in to like posts.');
      return;
    }

    const prevLiked = liked;
    const prevCount = likeCount;

    // Optimistic UI update
    setLiked(!prevLiked);
    setLikeCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);

    try {
      if (prevLiked) {
        const res = await api.delete(`/posts/${post.id}/like`);
        if (res.data.success) {
          setLikeCount(res.data.data.likeCount);
        }
      } else {
        const res = await api.post(`/posts/${post.id}/like`);
        if (res.data.success) {
          setLikeCount(res.data.data.likeCount);
        }
      }
    } catch {
      setLiked(prevLiked);
      setLikeCount(prevCount);
    }
  };

  const handleDoubleTap = () => {
    if (!liked) {
      toggleLike();
    }
    setHeartAnim(true);
    setTimeout(() => setHeartAnim(false), 800);
  };

  const loadComments = async () => {
    if (!showComments) {
      setLoadingComments(true);
      try {
        const res = await api.get(`/posts/${post.id}/comments`);
        if (res.data.success) {
          setComments(res.data.data.comments);
        }
      } finally {
        setLoadingComments(false);
      }
    }
    setShowComments(!showComments);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim() || submittingComment) return;
    if (!isAuthenticated) {
      alert('Please log in to comment.');
      return;
    }

    setSubmittingComment(true);
    try {
      const res = await api.post(`/posts/${post.id}/comments`, { content: newCommentText.trim() });
      if (res.data.success) {
        setComments([...comments, res.data.data.comment]);
        setCommentCount(commentCount + 1);
        setNewCommentText('');
        if (!showComments) setShowComments(true);
      }
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Delete this post?')) return;
    try {
      const res = await api.delete(`/posts/${post.id}`);
      if (res.data.success && onPostDeleted) {
        onPostDeleted(post.id);
      }
    } catch (err) {
      alert('Failed to delete post.');
    }
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.origin + `/posts/${post.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatRelativeTime = (dateStr) => {
    try {
      const diffSec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
      if (diffSec < 60) return 'Just now';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h`;
      if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d`;
      return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <article 
      className="glass-panel"
      style={{
        maxWidth: '470px',
        margin: '0 auto 1.5rem auto',
        backgroundColor: '#FFFFFF',
        borderRadius: '14px',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      {/* 1. Header (User Info + Timestamp + Options) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <Link to={`/profile/${post.author_username}`} style={{ textDecoration: 'none' }}>
            <div style={{
              padding: '2px',
              borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(45deg, #C5A059, #9A5B32)',
              display: 'flex',
            }}>
              <img 
                src={post.author_avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${post.author_username}`} 
                alt={post.author_username}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: 'var(--radius-full)',
                  border: '2px solid #FFFFFF',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            </div>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Link 
              to={`/profile/${post.author_username}`} 
              style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', textDecoration: 'none' }}
            >
              {post.author_username}
            </Link>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>•</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.775rem' }}>
              {formatRelativeTime(post.created_at)}
            </span>
          </div>
        </div>

        {/* 3-dots Menu */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px' }}
          >
            <MoreHorizontal size={18} />
          </button>

          {showMenu && (
            <div 
              className="glass-panel"
              style={{
                position: 'absolute',
                right: 0,
                top: '100%',
                backgroundColor: '#FFFFFF',
                borderRadius: '8px',
                padding: '0.35rem',
                minWidth: '130px',
                zIndex: 20,
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              {canDelete && (
                <button
                  onClick={handleDeletePost}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    background: 'none',
                    border: 'none',
                    color: '#ef4444',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    textAlign: 'left',
                    borderRadius: '4px',
                  }}
                >
                  <Trash2 size={14} />
                  <span>Delete</span>
                </button>
              )}
              <button
                onClick={handleShare}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  textAlign: 'left',
                  borderRadius: '4px',
                }}
              >
                <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Post Media / Visual Area */}
      {post.image_url ? (
        <div 
          onDoubleClick={handleDoubleTap}
          style={{ position: 'relative', width: '100%', backgroundColor: '#000', cursor: 'pointer', overflow: 'hidden' }}
        >
          <img 
            src={post.image_url} 
            alt="Post Visual" 
            style={{ width: '100%', maxHeight: '480px', objectFit: 'cover', display: 'block' }}
          />

          {/* Animated Heart Overlay on Double Tap */}
          {heartAnim && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%) scale(1.2)',
              animation: 'pulseGlow 0.8s ease-out forwards',
              color: '#FFFFFF',
              filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))',
            }}>
              <Heart size={80} fill="#FFFFFF" />
            </div>
          )}
        </div>
      ) : (
        /* Text-Only Editorial Post Canvas */
        <div 
          onDoubleClick={handleDoubleTap}
          style={{
            position: 'relative',
            padding: '2.5rem 1.75rem',
            backgroundColor: '#FAF7F0',
            borderTop: '1px solid #EFEAE0',
            borderBottom: '1px solid #EFEAE0',
            fontSize: '1.05rem',
            lineHeight: '1.65',
            color: 'var(--text-primary)',
            fontStyle: 'normal',
            cursor: 'pointer',
          }}
        >
          {post.content}

          {heartAnim && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: '#ef4444',
            }}>
              <Heart size={64} fill="#ef4444" />
            </div>
          )}
        </div>
      )}

      {/* 3. Action Buttons Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.65rem 1rem 0.35rem 1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Like Heart */}
          <button
            type="button"
            onClick={toggleLike}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: liked ? '#ef4444' : 'var(--text-primary)',
              padding: 0,
              display: 'flex',
              transition: 'transform 0.15s ease',
            }}
          >
            <Heart size={24} fill={liked ? '#ef4444' : 'none'} strokeWidth={2} />
          </button>

          {/* Comment Bubble */}
          <button
            type="button"
            onClick={loadComments}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              padding: 0,
              display: 'flex',
            }}
          >
            <MessageCircle size={24} strokeWidth={2} />
          </button>

          {/* Share Icon */}
          <button
            type="button"
            onClick={handleShare}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              padding: 0,
              display: 'flex',
            }}
          >
            <Send size={22} strokeWidth={2} />
          </button>
        </div>

        {/* Bookmark */}
        <button
          type="button"
          onClick={() => alert('Post saved to collection')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', padding: 0 }}
        >
          <Bookmark size={22} strokeWidth={2} />
        </button>
      </div>

      {/* 4. Like Count & Caption */}
      <div style={{ padding: '0 1rem', marginBottom: '0.5rem' }}>
        <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.35rem' }}>
          {likeCount.toLocaleString()} {likeCount === 1 ? 'like' : 'likes'}
        </div>

        {/* If the post has an image, render the text caption below the image like IG */}
        {post.image_url && (
          <div style={{ fontSize: '0.875rem', lineHeight: '1.5' }}>
            <Link 
              to={`/profile/${post.author_username}`}
              style={{ fontWeight: 700, color: 'var(--text-primary)', textDecoration: 'none', marginRight: '0.4rem' }}
            >
              {post.author_username}
            </Link>
            <span style={{ color: 'var(--text-primary)' }}>{post.content}</span>
          </div>
        )}
      </div>

      {/* 5. Comments Section */}
      <div style={{ padding: '0 1rem 0.5rem 1rem' }}>
        {commentCount > 0 && !showComments && (
          <button
            type="button"
            onClick={loadComments}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              fontSize: '0.825rem',
              padding: 0,
              marginBottom: '0.4rem',
            }}
          >
            View all {commentCount.toLocaleString()} comments
          </button>
        )}

        {/* Expanded Comments List */}
        {showComments && (
          <div style={{ marginTop: '0.5rem', marginBottom: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {loadingComments ? (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Loading comments...</div>
            ) : (
              comments.map((c) => (
                <div key={c.id} style={{ fontSize: '0.825rem', lineHeight: '1.4' }}>
                  <strong style={{ marginRight: '0.4rem' }}>{c.author_username}</strong>
                  <span style={{ color: 'var(--text-secondary)' }}>{c.content}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 6. Inline "Add a Comment..." Input */}
      <form 
        onSubmit={handleAddComment}
        style={{
          borderTop: '1px solid #F0ECE4',
          display: 'flex',
          alignItems: 'center',
          padding: '0.65rem 1rem',
          backgroundColor: '#FFFFFF',
        }}
      >
        <input 
          type="text"
          placeholder="Add a comment..."
          value={newCommentText}
          onChange={(e) => setNewCommentText(e.target.value)}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: '0.85rem',
            background: 'transparent',
            color: 'var(--text-primary)',
          }}
        />
        <button
          type="submit"
          disabled={!newCommentText.trim() || submittingComment}
          style={{
            background: 'none',
            border: 'none',
            color: newCommentText.trim() ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: newCommentText.trim() ? 'pointer' : 'default',
            paddingLeft: '0.5rem',
          }}
        >
          Post
        </button>
      </form>

    </article>
  );
}
