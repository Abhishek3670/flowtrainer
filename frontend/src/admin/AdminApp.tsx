import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';

// Context Providers
import { ThemeContextProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext'; // Import the admin AuthProvider

// Layout
import AdminLayoutContainer from './layout/AdminLayoutContainer';

// Pages
import DashboardPage from './pages/DashboardPage';
import UserManagementPage from './pages/UserManagementPage';
import SystemConfigPage from './pages/SystemConfigPage';
import DatabaseManagementPage from './pages/DatabaseManagementPage';
import ModelsConfigPage from './pages/ModelsConfigPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
// Newly added pages
import SystemMetricsPage from './pages/SystemMetricsPage';
import AuditLogsPage from './pages/AuditLogsPage';
import RoleManagementPage from './pages/RoleManagementPage';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Main App component
const AdminApp: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useUnifiedAuth();
  const location = useLocation();

  // Debug logging
  console.log('AdminApp rendered with:', { 
    isAuthenticated, 
    isLoading, 
    user,
    pathname: location.pathname,
    search: location.search,
    hash: location.hash
  });

  if (isLoading) {
    // You can replace this with a loading spinner or skeleton screen
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    // Redirect to unified login page
    console.log('Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Check if user has admin role
  if (user && user.role !== 'admin' && user.role !== 'super-admin') {
    // If not an admin, redirect to main app
    console.log('Not admin, redirecting to main app');
    return <Navigate to="/" replace />;
  }

  console.log('Rendering admin app for user:', user);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider> {/* Wrap with admin AuthProvider */}
        <ThemeContextProvider>
          <SnackbarProvider
            maxSnack={3}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <CssBaseline />
            <AdminLayoutContainer>
              <Routes>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="users" element={<UserManagementPage />} />
                <Route path="roles" element={<RoleManagementPage />} />
                <Route path="audit" element={<AuditLogsPage />} />
                <Route path="metrics" element={<SystemMetricsPage />} />
                <Route path="database" element={<DatabaseManagementPage />} />
                <Route path="system" element={<SystemConfigPage />} />
                <Route path="models" element={<ModelsConfigPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </AdminLayoutContainer>
          </SnackbarProvider>
        </ThemeContextProvider>
      </AuthProvider> {/* Close admin AuthProvider */}
      <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
    </QueryClientProvider>
  );
};

export default AdminApp;