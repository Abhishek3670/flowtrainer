import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

type AuthGuardProps = {
  children: React.ReactElement;
  requiredRole?: 'admin' | 'user';
};

// NOTE: Replace with real auth state when available
function useAuthMock() {
  // Default to admin for now; swap with Redux or context once implemented
  return { isAuthenticated: true, role: 'admin' as const };
}

export default function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const location = useLocation();
  const { isAuthenticated, role } = useAuthMock();

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}


