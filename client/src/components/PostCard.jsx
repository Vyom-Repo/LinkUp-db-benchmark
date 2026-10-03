import React, { useState } from 'react';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function PostCard({ post, onPostDeleted }) {
  const { token, user } = useAuth();
  const [liked, setLiked] = useState(post.is_liked_by_me || false);
  const [likeCount, setLikeCount] = useState(parseInt(post.like_count, 10) || 0);
  const [commentCount, setCommentCount] = useState(parseInt(post.comment_count, 10) || 0);
  
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [heartAnim, setHeartAnim] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const canDelete = user && (user.id === post.author_id || user.isAdmin);

  const toggleLike = async () => {
    const prevLiked = liked;
    const prevCount = likeCount;

    setLiked(!prevLiked);
    setLikeCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);

    try {
      const res = await fetch(`/api/posts/${post.id}/like`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setLiked(data.data.liked);
        setLikeCount(data.data.likeCount);
      } else {
        setLiked(prevLiked);
        setLikeCount(prevCount);
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
        const res = await fetch(`/api/posts/${post.id}/comments?_t=${Date.now()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (data.success) {
          setComments(data.data.comments);
        }
      } catch (err) {
        console.error('Failed to load comments:', err);
      } finally {
        setLoadingComments(false);
      }
    }
    setShowComments(!showComments);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || submittingComment) return;

    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newComment.trim() }),
      });

      const data = await res.json();
      if (data.success) {
        setComments((prev) => [...prev, data.data.comment]);
        setCommentCount((prev) => prev + 1);
        setNewComment('');
        if (!showComments) setShowComments(true);
      }
    } catch (err) {
      console.error('Failed to submit comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        if (onPostDeleted) onPostDeleted(post.id);
      } else {
        alert(data.error?.message || 'Failed to delete post.');
      }
    } catch {
      alert('Error deleting post.');
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
      {/* 1. Header (Author Avatar, Username & Menu) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1rem',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
              {post.author_username}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>•</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.775rem' }}>
              {formatRelativeTime(post.created_at)}
            </span>
          </div>
        </div>

        {/* 3-dots Menu Button */}
        <div style={{ position: 'relative' }}>
          <button 
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px' }}
            title="Options"
          >
            <MoreHorizontal size={18} />
          </button>

          {showMenu && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '100%',
              backgroundColor: '#FFFFFF',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-lg)',
              padding: '0.35rem',
              zIndex: 30,
              minWidth: '130px',
            }}>
              {canDelete && (
                <button
                  type="button"
                  onClick={() => { setShowMenu(false); handleDeletePost(); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    width: '100%',
                    padding: '0.5rem 0.65rem',
                    background: 'none',
                    border: 'none',
                    color: '#dc2626',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    borderRadius: '4px',
                    textAlign: 'left'
                  }}
                >
                  <Trash2 size={13} />
                  <span>Delete Post</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => { setShowMenu(false); handleShare(); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  width: '100%',
                  padding: '0.5rem 0.65rem',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  textAlign: 'left'
                }}
              >
                <Send size={13} />
                <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Visual / Editorial Canvas Area */}
      {post.image_url ? (
        <div 
          onDoubleClick={handleDoubleTap}
          style={{ position: 'relative', width: '100%', backgroundColor: '#000', cursor: 'pointer', overflow: 'hidden' }}
        >
          <img 
            src={post.image_url} 
            alt="Post" 
            style={{ width: '100%', maxHeight: '480px', objectFit: 'cover', display: 'block' }}
          />

          {heartAnim && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%) scale(1.2)',
              animation: 'fadeIn 0.2s ease-out',
              color: '#FFFFFF',
              filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))',
            }}>
              <Heart size={80} fill="#FFFFFF" />
            </div>
          )}
        </div>
      ) : (
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
            title={copied ? 'Link Copied!' : 'Copy Link'}
          >
            <Send size={22} strokeWidth={2} />
          </button>
        </div>

        <button
          type="button"
          onClick={() => alert('Post saved to collection!')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', padding: 0 }}
        >
          <Bookmark size={22} strokeWidth={2} />
        </button>
      </div>

      {/* 4. Likes Count & Caption */}
      <div style={{ padding: '0 1rem', marginBottom: '0.5rem' }}>
        <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.35rem' }}>
          {likeCount.toLocaleString()} {likeCount === 1 ? 'like' : 'likes'}
        </div>

        {post.image_url && (
          <div style={{ fontSize: '0.875rem', lineHeight: '1.5' }}>
            <strong style={{ marginRight: '0.4rem', color: 'var(--text-primary)' }}>
              {post.author_username}
            </strong>
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

        {showComments && (
          <div style={{ marginTop: '0.5rem', marginBottom: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {loadingComments ? (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Loading comments...</div>
            ) : comments.length === 0 ? (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No comments yet. Be the first to comment!</div>
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

      {/* 6. Inline "Add a comment..." Bar */}
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
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
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
          disabled={!newComment.trim() || submittingComment}
          style={{
            background: 'none',
            border: 'none',
            color: newComment.trim() ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: newComment.trim() ? 'pointer' : 'default',
            paddingLeft: '0.5rem',
          }}
        >
          {submittingComment ? '...' : 'Post'}
        </button>
      </form>

    </article>
  );
}
