import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';

interface ProtectedRouteProps {
  children: React.ReactElement;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useUnifiedAuth();
  const location = useLocation();

  // Debug logging
  console.log('ProtectedRoute checking access for:', location.pathname, { isAuthenticated, isLoading, user });

  if (isLoading) {
    // You can replace this with a loading spinner or skeleton screen
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('ProtectedRoute: Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Check if trying to access admin routes
  if (location.pathname.startsWith('/admin')) {
    // Check if user has admin role
    if (user && user.role !== 'admin' && user.role !== 'super-admin') {
      // If not an admin, redirect to main app
      console.log('ProtectedRoute: Not admin, redirecting to main app');
      return <Navigate to="/" replace />;
    }
  }

  console.log('ProtectedRoute: Allowing access to', location.pathname);
  return children;
};

export default ProtectedRoute;