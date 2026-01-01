import { useCallback } from 'react';
import { useAuthStore } from '@/store';
import { User, LoginData, RegisterData } from '@/types';

export const useAuth = () => {
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    login: storeLogin,
    logout: storeLogout,
    register: storeRegister,
    refreshToken: storeRefreshToken,
  } = useAuthStore();

  const login = useCallback(async (credentials: LoginData) => {
    try {
      await storeLogin(credentials.email, credentials.password);
    } catch (error) {
      throw error;
    }
  }, [storeLogin]);

  const register = useCallback(async (userData: RegisterData) => {
    try {
      await storeRegister(userData);
    } catch (error) {
      throw error;
    }
  }, [storeRegister]);

  const logout = useCallback(() => {
    storeLogout();
  }, [storeLogout]);

  const refreshAuth = useCallback(async () => {
    try {
      await storeRefreshToken();
    } catch (error) {
      console.error('Failed to refresh auth:', error);
      logout();
    }
  }, [storeRefreshToken, logout]);

  // Auto-refresh token periodically
  const setupAutoRefresh = useCallback(() => {
    if (!token) return;

    const refreshInterval = setInterval(async () => {
      try {
        await refreshAuth();
      } catch (error) {
        clearInterval(refreshInterval);
      }
    }, 15 * 60 * 1000); // Refresh every 15 minutes

    return () => clearInterval(refreshInterval);
  }, [token, refreshAuth]);

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
    register,
    refreshAuth,
    setupAutoRefresh,
  };
};