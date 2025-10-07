import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApiService, User } from '../services/authApi';

interface UnifiedAuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  resetPasswordWithCurrent: (email: string, currentPassword: string, newPassword: string) => Promise<void>; // Updated this line
}

const UnifiedAuthContext = createContext<UnifiedAuthContextType | undefined>(undefined);

export const useUnifiedAuth = () => {
  const context = useContext(UnifiedAuthContext);
  if (!context) {
    throw new Error('useUnifiedAuth must be used within a UnifiedAuthProvider');
  }
  return context;
};

interface UnifiedAuthProviderProps {
  children: ReactNode;
}

export const UnifiedAuthProvider: React.FC<UnifiedAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // Verify token and get user data
          const userData = await authApiService.getCurrentUser();
          setUser(userData);
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        localStorage.removeItem('token');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      // Call the actual API
      const response = await authApiService.login(email, password);
      const { accessToken, user } = response;
      
      localStorage.setItem('token', accessToken);
      setUser(user);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      setIsLoading(true);
      // Call the actual API
      const response = await authApiService.register(email, password, firstName, lastName);
      const { accessToken, user } = response;
      
      localStorage.setItem('token', accessToken);
      setUser(user);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authApiService.logout().catch(console.error);
    localStorage.removeItem('token');
    setUser(null);
  };

  const forgotPassword = async (email: string) => {
    try {
      await authApiService.forgotPassword(email);
    } catch (error) {
      console.error('Forgot password failed:', error);
      throw error;
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    try {
      await authApiService.resetPassword(token, newPassword);
    } catch (error) {
      console.error('Reset password failed:', error);
      throw error;
    }
  };

  // Add this new method
  const resetPasswordWithCurrent = async (email: string, currentPassword: string, newPassword: string) => {
    try {
      await authApiService.resetPasswordWithCurrent(email, currentPassword, newPassword);
    } catch (error) {
      console.error('Reset password with current failed:', error);
      throw error;
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    resetPasswordWithCurrent, // Add this line
  };

  return <UnifiedAuthContext.Provider value={value}>{children}</UnifiedAuthContext.Provider>;
};

export default UnifiedAuthContext;