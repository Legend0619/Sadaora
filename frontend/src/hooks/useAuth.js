import { useEffect } from 'react';
import useAuthStore from '../store/authStore';

export const useAuth = () => {
  const {
    user,
    isLoading,
    isAuthenticated,
    error,
    initialize,
    login,
    signup,
    logout,
    updateUser,
    clearError,
    refreshUser
  } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return {
    user,
    isLoading,
    isAuthenticated,
    error,
    login,
    signup,
    logout,
    updateUser,
    clearError,
    refreshUser
  };
};

export default useAuth;