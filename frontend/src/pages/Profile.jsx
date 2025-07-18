import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Edit, User, Heart, Users, Trash2, Upload } from 'lucide-react';
import { profileAPI, uploadAPI } from '../services/api';
import useAuthStore from '../store/authStore';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const { user, updateUser, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await profileAPI.getProfile();
      setProfile(response.data.profile);
    } catch (error) {
      toast.error('Failed to load profile', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const uploadResponse = await uploadAPI.uploadImage(file);
      const photoUrl = uploadResponse.data.url;
      
      await profileAPI.updatePhoto(photoUrl);
      setProfile(prev => ({ ...prev, photoUrl }));
      updateUser({ profile: { ...user.profile, photoUrl } });
      
      toast.success('Profile photo updated successfully');
    } catch (error) {
      toast.error('Failed to upload image', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteProfile = async () => {
    try {
      await profileAPI.deleteProfile();
      toast.success('Profile deleted successfully');
      logout();
      navigate('/login');
    } catch (error) {
      toast.error('Failed to delete profile', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg">Profile not found</div>
        <Link to="/profile/edit" className="text-blue-600 hover:text-blue-500 mt-2 inline-block">
          Create your profile
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-32"></div>
        
        {/* Profile Info */}
        <div className="relative px-6 pb-6">
          <div className="flex items-end space-x-5 -mt-16">
            {/* Profile Image */}
            <div className="relative">
              <div className="h-32 w-32 rounded-full bg-white p-2 shadow-lg">
                <div className="h-full w-full rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                  {profile.photoUrl ? (
                    <img
                      src={profile.photoUrl}
                      alt={profile.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-16 w-16 text-gray-600" />
                  )}
                </div>
              </div>
              
              {/* Upload Button */}
              <div className="absolute bottom-0 right-0">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-blue-700 transition-colors">
                    {uploading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Upload className="h-5 w-5" />
                    )}
                  </div>
                </label>
              </div>
            </div>
            
            {/* Profile Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
                  {profile.headline && (
                    <p className="text-gray-600 text-lg">{profile.headline}</p>
                  )}
                </div>
                
                <div className="flex space-x-3">
                  <Link
                    to="/profile/edit"
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Link>
                  
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </button>
                </div>
              </div>
              
              {/* Stats */}
              <div className="flex items-center space-x-6 mt-4">
                <div className="flex items-center space-x-2 text-gray-600">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">
                    {profile?.followersCount || 0} followers
                  </span>
                </div>
                
                <div className="flex items-center space-x-2 text-gray-600">
                  <User className="h-4 w-4" />
                  <span className="text-sm">
                    {profile?.followingCount || 0} following
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bio */}
          {profile.bio && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">About</h2>
              <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
            </div>
          )}
          
          {/* Interests */}
          {profile.interests && profile.interests.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Interests</h2>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map(interest => (
                  <span
                    key={interest}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Profile</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete your profile? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProfile}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;