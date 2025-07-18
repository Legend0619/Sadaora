import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Users, UserPlus, UserMinus, User } from 'lucide-react';
import { profileAPI, feedAPI } from '../services/api';

const Connections = () => {
  const [activeTab, setActiveTab] = useState('followers');
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      const [followersResponse, followingResponse] = await Promise.all([
        profileAPI.getFollowers(),
        profileAPI.getFollowing()
      ]);
      
      setFollowers(followersResponse.data.followers || []);
      setFollowing(followingResponse.data.following || []);
    } catch (error) {
      console.error('Failed to fetch connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async (userId) => {
    try {
      // Call the unfollow API
      await feedAPI.unfollowUser(userId);
      
      // Update the local state after successful API call
      setFollowing(prev => prev.filter(user => user.id !== userId));
      toast.success('Unfollowed successfully');
    } catch (error) {
      console.error('Failed to unfollow:', error);
      toast.error('Failed to unfollow');
    }
  };

  const renderUserCard = (user, isFollowing = false) => (
    <div key={user.id} className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center space-x-4">
        <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden flex-shrink-0">
          {user.profile?.photoUrl ? (
            <img
              src={user.profile.photoUrl}
              alt={user.profile.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <User className="h-6 w-6 text-gray-600" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {user.profile?.name || user.email}
              </h3>
              {user.profile?.headline && (
                <p className="text-gray-600 text-sm truncate">{user.profile.headline}</p>
              )}
            </div>
            
            {isFollowing && (
              <button
                onClick={() => handleUnfollow(user.id)}
                className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                <UserMinus className="h-4 w-4 mr-2" />
                Unfollow
              </button>
            )}
          </div>
          
          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
            <span>{user.followersCount || 0} followers</span>
            <span>{user.followingCount || 0} following</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('followers')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'followers'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Followers ({followers.length})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('following')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'following'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <UserPlus className="h-4 w-4" />
                <span>Following ({following.length})</span>
              </div>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {activeTab === 'followers' ? (
                followers.length > 0 ? (
                  followers.map(user => renderUserCard(user, false))
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No followers yet</h3>
                    <p className="text-gray-600">
                      When people follow you, they'll appear here.
                    </p>
                  </div>
                )
              ) : (
                following.length > 0 ? (
                  following.map(user => renderUserCard(user, true))
                ) : (
                  <div className="text-center py-12">
                    <UserPlus className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Not following anyone yet</h3>
                    <p className="text-gray-600">
                      Discover interesting people to follow in the{' '}
                      <a href="/feed" className="text-blue-600 hover:text-blue-500">
                        community feed
                      </a>
                      .
                    </p>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Connections;