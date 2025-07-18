import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken
          });
          
          const { accessToken } = response.data;
          localStorage.setItem('accessToken', accessToken);
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  signup: (userData) => api.post('/auth/signup', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  getCurrentUser: () => api.get('/auth/me'),
};

// Profile API
export const profileAPI = {
  getProfile: () => api.get('/profiles/me'),
  updateProfile: (profileData) => api.put('/profiles/me', profileData),
  deleteProfile: () => api.delete('/profiles/me'),
  updatePhoto: (photoUrl) => api.put('/profiles/me/photo', { photoUrl }),
  getFollowing: () => api.get('/profiles/following'),
  getFollowers: () => api.get('/profiles/followers'),
};

// Feed API
export const feedAPI = {
  getFeed: (params) => api.get('/feed', { params }),
  getProfile: (userId) => api.get(`/feed/${userId}`),
  likeProfile: (userId) => api.post(`/feed/${userId}/like`),
  followUser: (userId) => api.post(`/feed/${userId}/follow`),
  unfollowUser: (userId) => api.post(`/feed/${userId}/follow`), // Same endpoint, toggles based on current state
  getTrendingInterests: () => api.get('/feed/trending/interests'),
};

// Upload API
export const uploadAPI = {
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/upload/profile-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getPresignedUrl: (fileName, fileType) => 
    api.post('/upload/presigned-url', { fileName, fileType }),
};

export default api;