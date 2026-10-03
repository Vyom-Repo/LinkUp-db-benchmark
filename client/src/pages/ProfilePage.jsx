import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, FileText, Heart, MessageSquare } from 'lucide-react';
import PostCard from '../components/PostCard';
import api from '../services/api';

export default function ProfilePage() {
  const { username } = useParams();
  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        // Find user by username or fetch their posts
        const feedRes = await api.get('/posts?limit=100');
        if (feedRes.data.success) {
          const userPosts = feedRes.data.data.posts.filter((p) => p.author_username === username);
          setPosts(userPosts);
          if (userPosts.length > 0) {
            setProfileUser({
              name: userPosts[0].author_name,
              username: userPosts[0].author_username,
              avatar: userPosts[0].author_avatar,
              postCount: userPosts.length,
            });
          } else {
            setProfileUser({
              name: username,
              username,
              avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${username}`,
              postCount: 0,
            });
          }
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

  return (
    <div className="container" style={{ maxWidth: '800px', paddingTop: '2rem', paddingBottom: '4rem' }}>
      
      {/* Profile Header Card */}
      {profileUser && (
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <img 
              src={profileUser.avatar} 
              alt={profileUser.name} 
              style={{ width: '84px', height: '84px', borderRadius: 'var(--radius-full)', border: '2px solid var(--primary)' }}
            />
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>{profileUser.name}</h1>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '0.75rem' }}>
                @{profileUser.username}
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', marginBottom: '1rem' }}>
                Active participant in the Sync post–comment ecosystem. Exploring distributed databases and query optimization.
              </p>

              <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <FileText size={16} style={{ color: 'var(--primary)' }} />
                  <span><strong>{posts.length}</strong> Posts</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <Calendar size={16} />
                  <span>Joined Sync Network</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timeline Section */}
      <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>Activity Timeline</h3>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
          Loading user activity...
        </div>
      ) : posts.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          This user hasn't published any posts yet.
        </div>
      ) : (
        posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))
      )}

    </div>
  );
}
