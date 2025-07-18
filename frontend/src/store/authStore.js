import { create } from 'zustand';
import { authAPI } from '../services/api';

const useAuthStore = create((set, get) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,

  // Initialize auth state from localStorage
  initialize: () => {
    const token = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('userData');
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        set({ user, isAuthenticated: true });
      } catch (error) {
        console.error('Failed to parse user data:', error);
        get().logout();
      }
    }
  },

  // Login
  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.login(credentials);
      const { user, accessToken, refreshToken } = response.data;
      
      // Store tokens and user data
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('userData', JSON.stringify(user));
      
      set({ 
        user, 
        isAuthenticated: true, 
        isLoading: false 
      });
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      set({ 
        error: errorMessage, 
        isLoading: false 
      });
      return { success: false, error: errorMessage };
    }
  },

  // Signup
  signup: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.signup(userData);
      const { user, accessToken, refreshToken } = response.data;
      
      // Store tokens and user data
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('userData', JSON.stringify(user));
      
      set({ 
        user, 
        isAuthenticated: true, 
        isLoading: false 
      });
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Signup failed';
      set({ 
        error: errorMessage, 
        isLoading: false 
      });
      return { success: false, error: errorMessage };
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userData');
    
    set({ 
      user: null, 
      isAuthenticated: false, 
      error: null 
    });
  },

  // Update user profile
  updateUser: (userData) => {
    set((state) => ({
      user: { ...state.user, ...userData }
    }));
    
    // Update localStorage
    localStorage.setItem('userData', JSON.stringify(get().user));
  },

  // Clear error
  clearError: () => set({ error: null }),

  // Refresh user data
  refreshUser: async () => {
    try {
      const response = await authAPI.getCurrentUser();
      const { user } = response.data;
      
      set({ user });
      localStorage.setItem('userData', JSON.stringify(user));
      
      return { success: true };
    } catch (error) {
      console.error('Failed to refresh user:', error);
      return { success: false };
    }
  }
}));

export default useAuthStore;