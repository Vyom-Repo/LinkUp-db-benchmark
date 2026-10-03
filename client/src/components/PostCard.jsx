import React, { useState } from 'react';
import { Heart, MessageSquare, Share2, MoreHorizontal, Trash2 } from 'lucide-react';
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
    if (!window.confirm('Are you sure you want to delete this discussion post?')) return;
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
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}h`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}d`;
      return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <article 
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        marginBottom: '1rem',
        boxShadow: 'var(--shadow-sm)',
        transition: 'border-color 0.15s ease',
      }}
    >
      {/* 1. Header (Author, Username, Time & Options) */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        padding: '1.15rem 1.25rem 0.5rem 1.25rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img 
            src={post.author_avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${post.author_username}`} 
            alt={post.author_username}
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '8px',
              objectFit: 'cover',
              border: '1px solid var(--border-color)',
              backgroundColor: '#FAF8F5'
            }}
          />

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.2 }}>
              {post.author_name || post.author_username}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '2px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                @{post.author_username}
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>•</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                {formatRelativeTime(post.created_at)}
              </span>
            </div>
          </div>
        </div>

        {/* 3-dots Menu Button */}
        <div style={{ position: 'relative' }}>
          <button 
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}
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
                  <span>Delete</span>
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
                <Share2 size={13} />
                <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Text-First Discussion Content */}
      <div style={{
        padding: '0.5rem 1.25rem 0.85rem 1.25rem',
        fontSize: '0.965rem',
        lineHeight: '1.65',
        color: 'var(--text-primary)',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        {post.content}
      </div>

      {/* 3. Optional Compact Photo Attachment (if present) */}
      {post.image_url && (
        <div style={{ padding: '0 1.25rem 0.85rem 1.25rem' }}>
          <div style={{
            borderRadius: '10px',
            overflow: 'hidden',
            border: '1px solid var(--border-color)',
            maxHeight: '340px',
            backgroundColor: '#FAF8F5'
          }}>
            <img 
              src={post.image_url} 
              alt="Attachment" 
              style={{ width: '100%', maxHeight: '340px', objectFit: 'cover', display: 'block' }}
            />
          </div>
        </div>
      )}

      {/* 4. Stats Summary Line (e.g. 24 Likes · 8 Comments) */}
      <div style={{
        padding: '0.4rem 1.25rem 0.65rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.825rem',
        color: 'var(--text-muted)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span>{likeCount} {likeCount === 1 ? 'Like' : 'Likes'}</span>
          <span>•</span>
          <button
            onClick={loadComments}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, font: 'inherit' }}
          >
            {commentCount} {commentCount === 1 ? 'Comment' : 'Comments'}
          </button>
        </div>
      </div>

      {/* 5. Clean Action Buttons: Text + Icons */}
      <div style={{
        borderTop: '1px solid var(--border-color)',
        borderBottom: showComments ? '1px solid var(--border-color)' : 'none',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        padding: '0.2rem 0.5rem',
      }}>
        {/* Like */}
        <button
          type="button"
          onClick={toggleLike}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.45rem',
            padding: '0.6rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 600,
            borderRadius: '6px',
            color: liked ? 'var(--primary)' : 'var(--text-secondary)',
            transition: 'background-color 0.15s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FAF8F4'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <Heart size={16} fill={liked ? 'var(--primary)' : 'none'} color={liked ? 'var(--primary)' : 'currentColor'} strokeWidth={2} />
          <span>{liked ? 'Liked' : 'Like'}</span>
        </button>

        {/* Comment */}
        <button
          type="button"
          onClick={loadComments}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.45rem',
            padding: '0.6rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 600,
            borderRadius: '6px',
            color: 'var(--text-secondary)',
            transition: 'background-color 0.15s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FAF8F4'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <MessageSquare size={16} strokeWidth={2} />
          <span>Comment</span>
        </button>

        {/* Share */}
        <button
          type="button"
          onClick={handleShare}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.45rem',
            padding: '0.6rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 600,
            borderRadius: '6px',
            color: 'var(--text-secondary)',
            transition: 'background-color 0.15s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FAF8F4'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <Share2 size={16} strokeWidth={2} />
          <span>{copied ? 'Copied' : 'Share'}</span>
        </button>
      </div>

      {/* 6. Discussion Comments Section */}
      {showComments && (
        <div style={{ backgroundColor: '#FAF9F6', padding: '1rem 1.25rem' }}>
          
          {/* Comments List */}
          <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {loadingComments ? (
              <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Loading discussion...</div>
            ) : comments.length === 0 ? (
              <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>No replies yet. Join the conversation!</div>
            ) : (
              comments.map((c) => (
                <div key={c.id} style={{ display: 'flex', gap: '0.65rem' }}>
                  <img 
                    src={c.author_avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${c.author_username}`}
                    alt={c.author_username}
                    style={{ width: '28px', height: '28px', borderRadius: '6px', flexShrink: 0, marginTop: '2px' }}
                  />
                  <div style={{
                    backgroundColor: '#FFFFFF',
                    padding: '0.55rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    flex: 1
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.825rem', color: 'var(--text-primary)' }}>
                        {c.author_name || c.author_username}
                      </span>
                      <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                        {formatRelativeTime(c.created_at)}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {c.content}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Inline Comment Composer */}
          <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text"
              placeholder="Write a constructive reply..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="form-input"
              style={{
                fontSize: '0.85rem',
                padding: '0.55rem 0.85rem',
                backgroundColor: '#FFFFFF'
              }}
            />
            <button
              type="submit"
              disabled={!newComment.trim() || submittingComment}
              className="btn btn-primary"
              style={{
                padding: '0.55rem 1rem',
                fontSize: '0.825rem',
                borderRadius: 'var(--radius-md)',
              }}
            >
              {submittingComment ? '...' : 'Reply'}
            </button>
          </form>

        </div>
      )}

    </article>
  );
}
