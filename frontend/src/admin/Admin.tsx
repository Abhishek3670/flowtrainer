import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminLayout from './components/layout/AdminLayout';
import ProtectedRoute from './components/common/ProtectedRoute';

// Import page components
import DashboardPage from './pages/DashboardPage';
import UserManagementPage from './pages/UserManagementPage';
import SystemConfigPage from './pages/SystemConfigPage';
import DatabaseManagementPage from './pages/DatabaseManagementPage';
import ModelsConfigPage from './pages/ModelsConfigPage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';

const Admin: React.FC = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="users/*" element={<UserManagementPage />} />
        <Route path="system/*" element={<SystemConfigPage />} />
        <Route path="database/*" element={<DatabaseManagementPage />} />
        <Route path="models/*" element={<ModelsConfigPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};

export default Admin;
