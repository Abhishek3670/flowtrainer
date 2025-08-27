import { useSystemStatus } from '../../hooks/useSystemStatus';

export default function SystemHealthDashboard() {
  const { systemStatus, loading } = useSystemStatus();

  if (loading) {
    return <div className="text-sm text-gray-600">Loading system health...</div>;
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-600 dark:text-gray-300">System Health Overview</div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div className="text-xs text-gray-500 dark:text-gray-400">Max Concurrent</div>
          <div className="text-xl font-semibold mt-1">{systemStatus?.max_concurrent_executions ?? '-'}</div>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div className="text-xs text-gray-500 dark:text-gray-400">Running</div>
          <div className="text-xl font-semibold mt-1">{systemStatus?.running_executions ?? '-'}</div>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div className="text-xs text-gray-500 dark:text-gray-400">Queued</div>
          <div className="text-xl font-semibold mt-1">{systemStatus?.queued_executions ?? '-'}</div>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div className="text-xs text-gray-500 dark:text-gray-400">Utilization</div>
          <div className="text-xl font-semibold mt-1">{Math.round((systemStatus?.capacity_utilization ?? 0) * 100)}%</div>
        </div>
      </div>
      <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700 overflow-auto text-gray-800 dark:text-gray-100">
        {JSON.stringify(systemStatus, null, 2)}
      </pre>
    </div>
  );
}


