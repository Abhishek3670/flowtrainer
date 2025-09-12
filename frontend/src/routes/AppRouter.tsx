
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from '../App';
import AdminLayout from '../layouts/AdminLayout';
import AdminDashboard from '../pages/admin/AdminDashboard';
import UserManagement from '../pages/admin/UserManagement';
import WorkflowManagement from '../pages/admin/WorkflowManagement';
import DbConnections from '../pages/admin/DbConnections';
import ModelManagement from '../pages/admin/ModelManagement';
import SystemHealthDashboard from '../pages/admin/SystemHealthDashboard';
import AuthGuard from './AuthGuard';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />

        <Route path="/admin" element={<AdminLayout />}> 
          <Route index element={<AdminDashboard />} />
          <Route
            path="users"
            element={
              <AuthGuard requiredRole="admin">
                <UserManagement />
              </AuthGuard>
            }
          />
          <Route
            path="workflows"
            element={
              <AuthGuard requiredRole="admin">
                <WorkflowManagement />
              </AuthGuard>
            }
          />
          <Route
            path="db-connections"
            element={
              <AuthGuard requiredRole="admin">
                <DbConnections />
              </AuthGuard>
            }
          />
          <Route
            path="models"
            element={
              <AuthGuard requiredRole="admin">
                <ModelManagement />
              </AuthGuard>
            }
          />
          <Route
            path="system-health"
            element={
              <AuthGuard requiredRole="admin">
                <SystemHealthDashboard />
              </AuthGuard>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}


