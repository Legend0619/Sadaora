import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Filter } from 'lucide-react';
import { feedAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import SearchBar from '../components/common/SearchBar';
import ProfileCard from '../components/common/ProfileCard';

const Feed = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [interests, setInterests] = useState([]);
  
  const { user } = useAuthStore();

  useEffect(() => {
    fetchFeed();
    fetchInterests();
  }, [page, searchTerm, selectedInterests]);

  const fetchFeed = async () => {
    try {
      const params = {
        page,
        limit: 2,
        search: searchTerm,
        interests: selectedInterests.join(',')
      };
      
      const response = await feedAPI.getFeed(params);
      const newProfiles = response.data.profiles || [];
      
      if (page === 1) {
        setProfiles(newProfiles);
      } else {
        setProfiles(prev => [...prev, ...newProfiles]);
      }
      
      setHasMore(newProfiles.length === 2);
    } catch (error) {
      toast.error('Failed to load feed', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInterests = async () => {
    try {
      const response = await feedAPI.getTrendingInterests();
      setInterests(response.data.trending?.map(item => item.interest) || []);
    } catch (error) {
      console.error('Failed to fetch interests:', error);
    }
  };

  const handleLike = async (profileId) => {
    try {
      const response = await feedAPI.likeProfile(profileId);
      setProfiles(profiles.map(profile => 
        profile.id === profileId 
          ? { ...profile, isLiked: !profile.isLiked, likesCount: profile.isLiked ? profile.likesCount - 1 : profile.likesCount + 1 }
          : profile
      ));
      toast.success(response.data.message);
    } catch (error) {
      toast.error('Failed to like profile');
    }
  };

  const handleFollow = async (userId) => {
    try {
      const response = await feedAPI.followUser(userId);
      setProfiles(profiles.map(profile => 
        profile.userId === userId 
        ? { ...profile, isFollowing: !profile.isFollowing, followersCount: profile.isFollowing ? profile.followersCount - 1 : profile.followersCount + 1 }
        : profile
      ));

      toast.success(response.data.message);
    } catch (error) {
      toast.error('Failed to follow user');
    }
  };

  const toggleInterest = (interest) => {
    setSelectedInterests(prev => 
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
    setPage(1);
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    setPage(1);
  };

  const loadMore = () => {
    setPage(prev => prev + 1);
  };

  if (loading && page === 1) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Community Feed</h1>
        
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="mb-4">
            <SearchBar 
              onSearch={handleSearch}
              placeholder="Search profiles..."
            />
          </div>
          
          {/* Interest Filters */}
          {interests.length > 0 && (
            <div>
              <div className="flex items-center mb-3">
                <Filter className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm font-medium text-gray-700">Filter by interests:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {interests.map(interest => (
                  <button
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      selectedInterests.includes(interest)
                        ? 'bg-blue-100 text-blue-800 border-blue-300'
                        : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                    } border`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Feed */}
      <div className="space-y-6">
        {profiles.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No profiles found</div>
            <p className="text-gray-400 mt-2">Try adjusting your search or filters</p>
          </div>
        ) : (
          profiles.map(profile => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              onLike={handleLike}
              onFollow={handleFollow}
              currentUser={user}
            />
          ))
        )}
      </div>

      {/* Load More */}
      {hasMore && profiles.length > 0 && (
        <div className="text-center py-8">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Feed;