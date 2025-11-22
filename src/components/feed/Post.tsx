import { useState, useEffect } from 'react';
import { MessageCircle, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { CommentSection } from './CommentSection';

interface PostProps {
  post: {
    id: string;
    user_id: string;
    content: string;
    created_at: string;
  };
  onDelete: () => void;
}

interface Profile {
  username: string;
  full_name: string;
}

export function Post({ post, onDelete }: PostProps) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadProfile();
    loadCommentCount();
  }, [post.user_id]);

  const loadProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('username, full_name')
      .eq('id', post.user_id)
      .maybeSingle();

    if (data) setProfile(data);
  };

  const loadCommentCount = async () => {
    const { count } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post.id);

    setCommentCount(count || 0);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    setDeleting(true);
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', post.id);

    if (error) {
      console.error('Error deleting post:', error);
      setDeleting(false);
    } else {
      onDelete();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (!profile) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
            {profile.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {profile.full_name || profile.username}
            </h3>
            <p className="text-sm text-gray-500">{formatDate(post.created_at)}</p>
          </div>
        </div>

        {user?.id === post.user_id && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>

      <p className="text-gray-800 whitespace-pre-wrap mb-4">{post.content}</p>

      <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
        >
          <MessageCircle size={20} />
          <span className="text-sm font-medium">
            {commentCount} {commentCount === 1 ? 'Comment' : 'Comments'}
          </span>
        </button>
      </div>

      {showComments && (
        <CommentSection postId={post.id} onCommentChange={loadCommentCount} />
      )}
    </div>
  );
}
