import React, { useState } from 'react';
import { X, Image as ImageIcon, Sparkles, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const PHOTO_PRESETS = [
  { label: 'Architecture', url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80' },
  { label: 'Minimalist', url: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=800&auto=format&fit=crop&q=80' },
  { label: 'Workplace', url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800&auto=format&fit=crop&q=80' },
  { label: 'Nature', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80' },
  { label: 'Coffee', url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&auto=format&fit=crop&q=80' },
  { label: 'Cityscape', url: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?w=800&auto=format&fit=crop&q=80' },
];

export default function CreatePostModal({ isOpen, onClose, onPostCreated }) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || loading) return;

    setLoading(true);
    try {
      const res = await api.post('/posts', {
        content: content.trim(),
        imageUrl: imageUrl.trim() || undefined,
      });

      if (res.data.success) {
        setContent('');
        setImageUrl('');
        setShowImageOptions(false);
        if (onPostCreated) onPostCreated(res.data.data.post);
        onClose();
      }
    } catch (err) {
      alert('Failed to publish post: ' + (err.response?.data?.error?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(28, 25, 23, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem',
    }}>
      <div 
        className="glass-panel animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '520px',
          overflow: 'hidden',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          backgroundColor: '#FFFFFF',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Modal Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.85rem 1.25rem',
          borderBottom: '1px solid var(--border-color)',
        }}>
          <button 
            type="button" 
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
          >
            <X size={20} />
          </button>
          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Create New Post</span>
          <button
            onClick={handleSubmit}
            disabled={loading || !content.trim()}
            style={{
              background: 'none',
              border: 'none',
              color: content.trim() ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: 700,
              cursor: content.trim() ? 'pointer' : 'default',
              fontSize: '0.9rem',
            }}
          >
            {loading ? 'Sharing...' : 'Share'}
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.25rem' }}>
          {/* User Info Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <img 
              src={user?.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.username || 'user'}`}
              alt={user?.name}
              style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-color)' }}
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{user?.name}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>@{user?.username}</div>
            </div>
          </div>

          {/* Caption Area */}
          <textarea
            rows="4"
            placeholder="Write a caption..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="form-input"
            style={{
              border: 'none',
              background: 'transparent',
              boxShadow: 'none',
              padding: '0.25rem 0',
              fontSize: '1rem',
              resize: 'none',
              marginBottom: '1rem',
            }}
            autoFocus
          />

          {/* Optional Image Preview */}
          {imageUrl && (
            <div style={{ position: 'relative', marginBottom: '1rem', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
              <img 
                src={imageUrl} 
                alt="Post Preview" 
                style={{ width: '100%', maxHeight: '260px', objectFit: 'cover', display: 'block' }}
                onError={() => alert('Failed to load image from URL.')}
              />
              <button
                type="button"
                onClick={() => setImageUrl('')}
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  background: 'rgba(0,0,0,0.6)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius-full)',
                  padding: '4px',
                  cursor: 'pointer',
                }}
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Photo Attachment Bar */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setShowImageOptions(!showImageOptions)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                <ImageIcon size={18} style={{ color: 'var(--primary)' }} />
                <span>{imageUrl ? 'Change Photo' : 'Add Photo'}</span>
              </button>

              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {content.length} characters
              </span>
            </div>

            {/* Photo Preset Selectors or URL */}
            {showImageOptions && (
              <div style={{ background: '#FAF8F4', padding: '0.75rem', borderRadius: '10px', marginTop: '0.5rem', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  Select Preset Photography or Paste Image URL:
                </div>

                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
                  {PHOTO_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setImageUrl(p.url)}
                      style={{
                        padding: '0.25rem 0.6rem',
                        fontSize: '0.75rem',
                        borderRadius: 'var(--radius-full)',
                        border: imageUrl === p.url ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                        background: imageUrl === p.url ? 'var(--primary)' : '#FFFFFF',
                        color: imageUrl === p.url ? '#FFFFFF' : 'var(--text-secondary)',
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
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="form-input"
                  style={{ fontSize: '0.8rem', padding: '0.45rem 0.75rem' }}
                />
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
