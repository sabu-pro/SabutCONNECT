import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { UserPlus, UserCheck, UserX, Check, X } from 'lucide-react';

interface Profile {
  id: string;
  username: string;
  full_name: string;
  bio: string;
}

interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export function FriendsPage() {
  const { user } = useAuth();
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    const [usersResult, friendshipsResult] = await Promise.all([
      supabase.from('profiles').select('*').neq('id', user.id),
      supabase.from('friendships').select('*').or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
    ]);

    if (usersResult.data) setAllUsers(usersResult.data);
    if (friendshipsResult.data) setFriendships(friendshipsResult.data);
    setLoading(false);
  };

  const sendFriendRequest = async (friendId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('friendships')
      .insert({
        user_id: user.id,
        friend_id: friendId,
        status: 'pending',
      });

    if (error) {
      console.error('Error sending friend request:', error);
    } else {
      await loadData();
    }
  };

  const acceptFriendRequest = async (friendshipId: string) => {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', friendshipId);

    if (error) {
      console.error('Error accepting friend request:', error);
    } else {
      await loadData();
    }
  };

  const rejectFriendRequest = async (friendshipId: string) => {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);

    if (error) {
      console.error('Error rejecting friend request:', error);
    } else {
      await loadData();
    }
  };

  const removeFriend = async (friendshipId: string) => {
    if (!confirm('Are you sure you want to remove this friend?')) return;

    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);

    if (error) {
      console.error('Error removing friend:', error);
    } else {
      await loadData();
    }
  };

  const getFriendshipStatus = (profileId: string) => {
    return friendships.find(
      (f) =>
        (f.user_id === user?.id && f.friend_id === profileId) ||
        (f.friend_id === user?.id && f.user_id === profileId)
    );
  };

  const pendingRequests = allUsers.filter((profile) => {
    const friendship = getFriendshipStatus(profile.id);
    return friendship && friendship.status === 'pending' && friendship.friend_id === user?.id;
  });

  const friends = allUsers.filter((profile) => {
    const friendship = getFriendshipStatus(profile.id);
    return friendship && friendship.status === 'accepted';
  });

  const suggestions = allUsers.filter((profile) => {
    const friendship = getFriendshipStatus(profile.id);
    return !friendship;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {pendingRequests.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Friend Requests</h2>
          <div className="space-y-3">
            {pendingRequests.map((profile) => {
              const friendship = getFriendshipStatus(profile.id)!;
              return (
                <div key={profile.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                      {profile.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {profile.full_name || profile.username}
                      </h3>
                      <p className="text-sm text-gray-600">@{profile.username}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => acceptFriendRequest(friendship.id)}
                      className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
                      title="Accept"
                    >
                      <Check size={20} />
                    </button>
                    <button
                      onClick={() => rejectFriendRequest(friendship.id)}
                      className="bg-gray-200 text-gray-700 p-2 rounded-lg hover:bg-gray-300 transition-colors"
                      title="Reject"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">My Friends ({friends.length})</h2>
        {friends.length === 0 ? (
          <p className="text-gray-500">No friends yet. Start connecting!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {friends.map((profile) => {
              const friendship = getFriendshipStatus(profile.id)!;
              return (
                <div key={profile.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                      {profile.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {profile.full_name || profile.username}
                      </h3>
                      <p className="text-sm text-gray-600">@{profile.username}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFriend(friendship.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                    title="Remove friend"
                  >
                    <UserX size={20} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">People You May Know</h2>
        {suggestions.length === 0 ? (
          <p className="text-gray-500">No suggestions at the moment.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {suggestions.map((profile) => {
              const friendship = getFriendshipStatus(profile.id);
              const isPending = friendship && friendship.status === 'pending' && friendship.user_id === user?.id;

              return (
                <div key={profile.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                      {profile.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {profile.full_name || profile.username}
                      </h3>
                      <p className="text-sm text-gray-600">@{profile.username}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => sendFriendRequest(profile.id)}
                    disabled={isPending}
                    className={`p-2 rounded-lg transition-colors ${
                      isPending
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                    title={isPending ? 'Request sent' : 'Add friend'}
                  >
                    {isPending ? <UserCheck size={20} /> : <UserPlus size={20} />}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
