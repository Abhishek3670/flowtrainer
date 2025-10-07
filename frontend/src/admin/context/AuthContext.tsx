import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUnifiedAuth } from '../../contexts/UnifiedAuthContext';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { user: unifiedUser, isAuthenticated, isLoading, login, logout } = useUnifiedAuth();
  const [adminUser, setAdminUser] = useState<User | null>(null);

  // Map unified user to admin user type
  useEffect(() => {
    if (unifiedUser) {
      // Convert the unified user to admin user format
      const mappedUser: User = {
        id: unifiedUser.id,
        email: unifiedUser.email,
        firstName: unifiedUser.firstName,
        lastName: unifiedUser.lastName,
        role: unifiedUser.role,
        permissions: unifiedUser.permissions || [],
        isActive: unifiedUser.isActive,
        lastLogin: unifiedUser.lastLogin,
        createdAt: unifiedUser.createdAt,
        updatedAt: unifiedUser.updatedAt
      };
      setAdminUser(mappedUser);
    } else {
      setAdminUser(null);
    }
  }, [unifiedUser]);

  const hasPermission = (permission: string): boolean => {
    if (!adminUser) return false;
    
    // Admin has all permissions
    if (adminUser.role === 'admin' || adminUser.role === 'super-admin') {
      return true;
    }
    
    // Check user's permissions array if it exists
    return adminUser.permissions.includes(permission);
  };

  const value = {
    user: adminUser,
    isAuthenticated: isAuthenticated && !!adminUser && (adminUser.role === 'admin' || adminUser.role === 'super-admin'),
    isLoading,
    login,
    logout,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;