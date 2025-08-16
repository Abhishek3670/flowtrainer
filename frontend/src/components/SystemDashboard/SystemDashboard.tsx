import React, { useEffect } from 'react';
import { useSystemStatus } from '../../hooks/useSystemStatus';
import { Clock, Activity, List, Cpu, AlertCircle } from 'lucide-react';

interface SystemDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SystemDashboard({ isOpen, onClose }: SystemDashboardProps) {
  const { systemStatus, loading, error } = useSystemStatus();

  // Debug logging
  useEffect(() => {
    if (systemStatus) {
      console.log('[SystemDashboard] System status loaded:', systemStatus);
    }
  }, [systemStatus]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Activity className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              System Dashboard
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading system status...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-800 dark:text-red-200">Error: {error}</span>
              </div>
            </div>
          )}

          {!loading && !error && !systemStatus && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <span className="text-yellow-800 dark:text-yellow-200">No system status available</span>
              </div>
            </div>
          )}

          {systemStatus && !loading && (
            <>
              {/* Debug info in development */}
              {process.env.NODE_ENV === 'development' && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-xs font-mono">
                  <div>Debug: systemStatus keys: {Object.keys(systemStatus).join(', ')}</div>
                  <div>Debug: capacity_utilization: {systemStatus.capacity_utilization}</div>
                  <div>Debug: queued_executions: {systemStatus.queued_executions}</div>
                  <div>Debug: running_executions: {systemStatus.running_executions}</div>
                </div>
              )}

              {/* System Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <MetricCard
                  icon={<Cpu className="w-5 h-5" />}
                  title="Capacity"
                  value={`${Math.round(systemStatus.capacity_utilization || 0)}%`}
                  subtitle={`${systemStatus.running_executions || 0}/${systemStatus.max_concurrent_executions || 0} running`}
                  color={(systemStatus.capacity_utilization || 0) > 80 ? 'red' : 'green'}
                />
                
                <MetricCard
                  icon={<List className="w-5 h-5" />}
                  title="Queue"
                  value={(systemStatus.queued_executions || 0).toString()}
                  subtitle="executions queued"
                  color="blue"
                />
                
                <MetricCard
                  icon={<Activity className="w-5 h-5" />}
                  title="Running"
                  value={(systemStatus.running_executions || 0).toString()}
                  subtitle="active executions"
                  color="green"
                />
                
                <MetricCard
                  icon={<Clock className="w-5 h-5" />}
                  title="Max Concurrent"
                  value={(systemStatus.max_concurrent_executions || 0).toString()}
                  subtitle="execution limit"
                  color="gray"
                />
              </div>

              {/* Capacity Bar */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    System Capacity
                  </span>
                  <span className="text-sm text-gray-500">
                    {systemStatus.running_executions || 0}/{systemStatus.max_concurrent_executions || 0}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${
                      (systemStatus.capacity_utilization || 0) > 80
                        ? 'bg-red-500'
                        : (systemStatus.capacity_utilization || 0) > 60
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${systemStatus.capacity_utilization || 0}%` }}
                  />
                </div>
              </div>

              {/* Running Executions */}
              {systemStatus.running && systemStatus.running.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                    Running Executions
                  </h3>
                  <div className="space-y-2">
                    {systemStatus.running.map((execution) => (
                      <RunningExecutionCard key={execution.project_id} execution={execution} />
                    ))}
                  </div>
                </div>
              )}

              {/* Queue */}
              {systemStatus.queue && systemStatus.queue.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                    Execution Queue
                  </h3>
                  <div className="space-y-2">
                    {systemStatus.queue.map((queuedExecution, index) => (
                      <QueuedExecutionCard 
                        key={queuedExecution.project_id} 
                        execution={queuedExecution}
                        position={index + 1}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Metric Card Component
function MetricCard({ icon, title, value, subtitle, color }: {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  color: 'red' | 'green' | 'blue' | 'gray';
}) {
  const colorClasses = {
    red: 'text-red-600 bg-red-50 dark:bg-red-900/20',
    green: 'text-green-600 bg-green-50 dark:bg-green-900/20',
    blue: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
    gray: 'text-gray-600 bg-gray-50 dark:bg-gray-900/20'
  };

  return (
    <div className={`p-4 rounded-lg ${colorClasses[color]} border border-opacity-20`}>
      <div className="flex items-center space-x-2 mb-2">
        {icon}
        <span className="text-sm font-medium">{title}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs opacity-75">{subtitle}</div>
    </div>
  );
}

// Running Execution Card
function RunningExecutionCard({ execution }: { execution: any }) {
  // Safety check for execution data
  if (!execution || !execution.project_id) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="text-sm text-gray-500">Invalid execution data</div>
      </div>
    );
  }

  return (
    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium text-green-800 dark:text-green-200">
            {execution.project_id}
          </div>
          <div className="text-sm text-green-600 dark:text-green-300">
            Step: {execution.current_step || 'Starting...'}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-green-800 dark:text-green-200">
            {execution.progress || 0}%
          </div>
          <div className="text-xs text-green-600 dark:text-green-300">
            {execution.started_at ? new Date(execution.started_at).toLocaleTimeString() : 'Unknown'}
          </div>
        </div>
      </div>
      {execution.progress && (
        <div className="mt-2">
          <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${execution.progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Queued Execution Card
function QueuedExecutionCard({ execution, position }: { execution: any; position: number }) {
  // Safety check for execution data
  if (!execution || !execution.project_id) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="text-sm text-gray-500">Invalid execution data</div>
      </div>
    );
  }

  const priorityColors = {
    1: 'bg-gray-100 text-gray-800 border-gray-300',
    2: 'bg-blue-100 text-blue-800 border-blue-300',
    3: 'bg-red-100 text-red-800 border-red-300'
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-gray-200 dark:bg-gray-700 rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium">
            {position}
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              {execution.project_id}
            </div>
            <div className="text-sm text-gray-500">
              Queued {execution.queued_at ? new Date(execution.queued_at).toLocaleTimeString() : 'Unknown'}
            </div>
          </div>
        </div>
        <div className={`px-2 py-1 rounded text-xs font-medium border ${
          priorityColors[execution.priority as keyof typeof priorityColors] || priorityColors[1]
        }`}>
          Priority {execution.priority || 1}
        </div>
      </div>
    </div>
  );
}
