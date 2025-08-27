import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useSystemStatus } from '../hooks/useSystemStatus';

function SidebarItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `flex items-center px-4 py-2 rounded-md transition-colors ${
          isActive ? 'bg-primary-500 text-white' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`
      }
    >
      <span className="text-sm font-medium">{label}</span>
    </NavLink>
  );
}

function HealthIndicator() {
  const { systemStatus } = useSystemStatus();
  // Consider healthy when capacity utilization < 80% and queue small
  const ok = (systemStatus?.capacity_utilization || 0) < 0.8 && (systemStatus?.queued_executions || 0) < 3;
  return (
    <div className="flex items-center space-x-2">
      <span className={`w-2 h-2 rounded-full ${ok ? 'bg-green-500' : 'bg-red-500'}`} />
      <span className="text-xs text-gray-600 dark:text-gray-300">{ok ? 'Healthy' : 'Degraded'}</span>
    </div>
  );
}

function ConnectionStatus() {
  const { systemStatus } = useSystemStatus();
  const connected = !!systemStatus;
  return (
    <div className="text-xs text-gray-600 dark:text-gray-300">{connected ? 'Connected' : 'Disconnected'}</div>
  );
}

export default function AdminLayout() {
  const location = useLocation();
  return (
    <div className="w-full h-screen grid grid-cols-[240px_1fr] grid-rows-[56px_1fr] bg-gray-50 dark:bg-gray-900">
      <aside className="row-span-2 col-start-1 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-3 space-y-2">
        <div className="px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-300">Admin</div>
        <SidebarItem to="/admin" label="Dashboard" />
        <SidebarItem to="/admin/users" label="Users" />
        <SidebarItem to="/admin/workflows" label="Workflows" />
        <SidebarItem to="/admin/db-connections" label="DB Connections" />
        <SidebarItem to="/admin/models" label="Models" />
        <SidebarItem to="/admin/system-health" label="System Health" />
      </aside>

      <header className="col-start-2 h-14 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between px-4">
        <div className="text-sm text-gray-700 dark:text-gray-200">{location.pathname}</div>
        <div className="flex items-center space-x-4">
          <HealthIndicator />
          <ConnectionStatus />
        </div>
      </header>

      <main className="col-start-2 overflow-auto p-4 text-gray-900 dark:text-gray-100">
        <Outlet />
      </main>
    </div>
  );
}


