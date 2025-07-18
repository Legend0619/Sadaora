import React from 'react';
import { User, Heart, Users, MessageCircle } from 'lucide-react';

const ProfileCard = ({ profile, onLike, onFollow, currentUser }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-4">
        {/* Profile Image */}
        <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden flex-shrink-0">
          {profile.photoUrl ? (
            <img
              src={profile.photoUrl}
              alt={profile.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <User className="h-6 w-6 text-gray-600" />
          )}
        </div>
        
        {/* Profile Info */}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{profile.name}</h3>
              {profile.headline && (
                <p className="text-gray-600 text-sm">{profile.headline}</p>
              )}
            </div>
            
            {profile.userId !== currentUser?.id && (
              <button
                onClick={() => onFollow(profile.userId)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  profile.isFollowing
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {profile.isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
          </div>
          
          {profile.bio && (
            <p className="text-gray-700 mt-3 line-clamp-3">{profile.bio}</p>
          )}
          
          {/* Interests */}
          {profile.interests && profile.interests.length > 0 && (
            <div className="mt-3">
              <div className="flex flex-wrap gap-2">
                {profile.interests.slice(0, 3).map(interest => (
                  <span
                    key={interest}
                    className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                  >
                    {interest}
                  </span>
                ))}
                {profile.interests.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                    +{profile.interests.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex items-center space-x-6 mt-4">
            <button
              onClick={() => onLike(profile.id)}
              className={`flex items-center space-x-2 text-sm ${
                profile.isLiked 
                  ? 'text-red-600' 
                  : 'text-gray-500 hover:text-red-600'
              }`}
            >
              <Heart className={`h-4 w-4 ${profile.isLiked ? 'fill-current' : ''}`} />
              <span>{profile.likesCount || 0}</span>
            </button>
            
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Users className="h-4 w-4" />
              <span>{profile.followersCount || 0} followers</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;