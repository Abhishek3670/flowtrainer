import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';

// Context Providers
import { ThemeContextProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';

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

// Protected route component
interface ProtectedRouteProps {
  children: React.ReactElement;
  requiredRole?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole = 'admin' }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    // You can replace this with a loading spinner or skeleton screen
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has the required role
  if (user && (user.role === requiredRole || user.role === 'super-admin')) {
    return children;
  }

  // If user doesn't have the required role, redirect to dashboard or show unauthorized
  return <Navigate to="/unauthorized" replace />;
};

// Main App component
const AdminApp: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeContextProvider>
        <SnackbarProvider
          maxSnack={3}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <AuthProvider>
            <CssBaseline />
            <Router>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<LoginPage />} />
                
                {/* Protected admin routes */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <AdminLayoutContainer />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<DashboardPage />} />
                  <Route path="users" element={<UserManagementPage />} />
                  <Route path="system" element={<SystemConfigPage />} />
                  <Route path="database" element={<DatabaseManagementPage />} />
                  <Route path="models" element={<ModelsConfigPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>
                
                {/* Catch-all route */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Router>
          </AuthProvider>
        </SnackbarProvider>
      </ThemeContextProvider>
      <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
    </QueryClientProvider>
  );
};

export default AdminApp;
