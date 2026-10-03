import React, { useState } from 'react';
import { Send, Image, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function CreatePostBox({ onPostCreated }) {
  const { user, isAuthenticated } = useAuth();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isAuthenticated) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || loading) return;

    setLoading(true);
    try {
      const res = await api.post('/posts', { content: content.trim() });
      if (res.data.success) {
        setContent('');
        if (onPostCreated) {
          onPostCreated(res.data.data.post);
        }
      }
    } catch (err) {
      alert('Failed to publish post: ' + (err.response?.data?.error?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: '0.875rem' }}>
          <img 
            src={user.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.username}`} 
            alt={user.name} 
            style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-color)' }}
          />
          <div style={{ flex: 1 }}>
            <textarea
              rows="3"
              placeholder={`What's on your mind, ${user.name.split(' ')[0]}?`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="form-input"
              style={{ 
                resize: 'none', 
                background: 'rgba(0,0,0,0.2)', 
                lineHeight: '1.5',
                marginBottom: '0.75rem'
              }}
            />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '0.5rem', color: 'var(--text-muted)' }}>
                <span style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Sparkles size={13} style={{ color: 'var(--primary)' }} />
                  <span>Real-time post sync</span>
                </span>
              </div>

              <button 
                type="submit" 
                disabled={loading || !content.trim()} 
                className="btn btn-primary"
                style={{ padding: '0.5rem 1.25rem' }}
              >
                <Send size={15} />
                <span>{loading ? 'Posting...' : 'Post'}</span>
              </button>
            </div>

          </div>
        </div>
      </form>
    </div>
  );
}
