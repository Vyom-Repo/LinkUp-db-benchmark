import React, { useState } from 'react';
import { Heart, MessageCircle, Trash2, Send, Clock } from 'lucide-react';
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
  const [deleting, setDeleting] = useState(false);

  const canDelete = user && (user.id === post.author_id || user.isAdmin);

  const toggleLike = async () => {
    if (!isAuthenticated) {
      alert('Please log in to like posts.');
      return;
    }

    const previousLiked = liked;
    const previousCount = likeCount;

    // Optimistic UI update
    setLiked(!previousLiked);
    setLikeCount(previousLiked ? Math.max(0, previousCount - 1) : previousCount + 1);

    try {
      if (previousLiked) {
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
    } catch (err) {
      // Revert on error
      setLiked(previousLiked);
      setLikeCount(previousCount);
    }
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
    if (!newCommentText.trim()) return;
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
      }
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    setDeleting(true);
    try {
      const res = await api.delete(`/posts/${post.id}`);
      if (res.data.success) {
        if (onPostDeleted) onPostDeleted(post.id);
      }
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <article className="glass-panel glass-panel-hover" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
      
      {/* Post Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img 
            src={post.author_avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${post.author_username || 'user'}`} 
            alt={post.author_name} 
            style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-color)' }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{post.author_name}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>@{post.author_username}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              <Clock size={12} />
              <span>{formatDate(post.created_at)}</span>
            </div>
          </div>
        </div>

        {canDelete && (
          <button 
            onClick={handleDeletePost} 
            disabled={deleting}
            className="btn btn-danger" 
            style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
            title="Delete post"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Post Content */}
      <div style={{ 
        fontSize: '0.975rem', 
        lineHeight: '1.6', 
        color: 'var(--text-primary)',
        whiteSpace: 'pre-wrap', 
        marginBottom: '1rem' 
      }}>
        {post.content}
      </div>

      {/* Post Action Bar */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '1.5rem', 
        borderTop: '1px solid var(--border-color)', 
        paddingTop: '0.75rem' 
      }}>
        
        {/* Like Button */}
        <button 
          onClick={toggleLike}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.375rem',
            background: 'transparent',
            border: 'none',
            color: liked ? '#ef4444' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 600,
            transition: 'color 0.15s ease'
          }}
        >
          <Heart size={18} fill={liked ? '#ef4444' : 'none'} />
          <span>{likeCount.toLocaleString()}</span>
        </button>

        {/* Comment Button */}
        <button 
          onClick={loadComments}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.375rem',
            background: 'transparent',
            border: 'none',
            color: showComments ? 'var(--primary)' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 600,
            transition: 'color 0.15s ease'
          }}
        >
          <MessageCircle size={18} />
          <span>{commentCount.toLocaleString()}</span>
        </button>

      </div>

      {/* Comment Section (Expandable) */}
      {showComments && (
        <div style={{ 
          marginTop: '1rem', 
          paddingTop: '1rem', 
          borderTop: '1px solid rgba(255, 255, 255, 0.05)' 
        }} className="animate-fade-in">
          
          {/* New Comment Input */}
          <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input 
              type="text" 
              placeholder="Write a comment..." 
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              className="form-input"
              style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
            />
            <button 
              type="submit" 
              disabled={submittingComment || !newCommentText.trim()}
              className="btn btn-primary"
              style={{ padding: '0.5rem 1rem' }}
            >
              <Send size={15} />
            </button>
          </form>

          {/* Comment Thread List */}
          {loadingComments ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '0.75rem' }}>
              Loading comments...
            </div>
          ) : comments.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '0.5rem' }}>
              No comments yet. Start the conversation!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {comments.map((c) => (
                <div 
                  key={c.id} 
                  style={{ 
                    background: 'rgba(0, 0, 0, 0.25)', 
                    borderRadius: 'var(--radius-md)', 
                    padding: '0.625rem 0.875rem',
                    border: '1px solid rgba(255, 255, 255, 0.03)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{c.author_name}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>@{c.author_username}</span>
                    </div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                      {formatDate(c.created_at)}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {c.content}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

    </article>
  );
}
