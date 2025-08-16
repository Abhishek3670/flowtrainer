// frontend/src/components/ExecutionLogs/ExecutionLogs.tsx
import React, { useState, useEffect, useRef } from 'react';
import './ExecutionLogs.css';
import { 
  Terminal, Download, Trash2, Play, AlertCircle, 
  Info, AlertTriangle, Bug, Search 
} from 'lucide-react';

interface ExecutionLogsProps {
  logs: LogEntry[];
  isStreaming: boolean;
  error?: string | null;
  onRetry?: (fromStep?: string) => void;
  onClear: () => void;
  projectId: string;
}

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  step?: string;
}
export default function ExecutionLogs({
  logs,
  isStreaming,
  error,
  onRetry,
  onClear,
  projectId
}: ExecutionLogsProps) {
  const [filter, setFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  // Handle manual scrolling (disable auto-scroll if user scrolls up)
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;
    setAutoScroll(isNearBottom);
  };

  // Filter logs based on level and search term
  const filteredLogs = logs.filter(log => {
    const matchesFilter = filter === 'ALL' || log.level === filter;
    const matchesSearch = searchTerm === '' || 
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.step?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  // Download logs as text file
  const downloadLogs = () => {
    const logText = filteredLogs.map(log => 
      `[${log.timestamp}] [${log.level}]${log.step ? ` [${log.step}]` : ''} ${log.message}`
    ).join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectId}-execution-logs.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Get log level icon and color
  const getLogLevelStyle = (level: string) => {
    switch (level) {
      case 'ERROR':
        return { 
          icon: <AlertCircle className="w-4 h-4" />, 
          color: 'text-red-600 bg-red-50 dark:bg-red-900/20' 
        };
      case 'WARNING':
        return { 
          icon: <AlertTriangle className="w-4 h-4" />, 
          color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20' 
        };
      case 'DEBUG':
        return { 
          icon: <Bug className="w-4 h-4" />, 
          color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' 
        };
      default:
        return { 
          icon: <Info className="w-4 h-4" />, 
          color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' 
        };
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <Terminal className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Execution Logs
          </h3>
          {isStreaming && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-600 dark:text-green-400">Live</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="ALL">All Levels</option>
            <option value="INFO">Info</option>
            <option value="WARNING">Warning</option>
            <option value="ERROR">Error</option>
            <option value="DEBUG">Debug</option>
          </select>

          {/* Actions */}
          <button
            onClick={downloadLogs}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            title="Download Logs"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={onClear}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            title="Clear Logs"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {error && onRetry && (
            <button
              onClick={() => onRetry()}
              className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              title="Retry Execution"
            >
              <Play className="w-4 h-4" />
              <span>Retry</span>
            </button>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800 dark:text-red-200">Execution Error: {error}</span>
          </div>
        </div>
      )}

      {/* Logs Container */}
      <div 
        ref={logsContainerRef}
        onScroll={handleScroll}
        className="h-96 overflow-y-auto bg-gray-50 dark:bg-gray-900 font-mono text-sm"
      >
        {filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            {logs.length === 0 ? 'No logs yet...' : 'No logs match current filter'}
          </div>
        ) : (
          <div className="p-4 space-y-1">
            {filteredLogs.map((log, index) => {
              const { icon, color } = getLogLevelStyle(log.level);
              
              return (
                <div 
                  key={index}
                  className={`flex items-start space-x-3 p-2 rounded ${color} hover:bg-opacity-80`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 text-xs opacity-75 mb-1">
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                      {log.step && (
                        <>
                          <span>•</span>
                          <span className="font-medium">{log.step}</span>
                        </>
                      )}
                    </div>
                    <div className="break-words">{log.message}</div>
                  </div>
                </div>
              );
            })}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
        <div>
          {filteredLogs.length} of {logs.length} log entries
        </div>
        <div className="flex items-center space-x-2">
          <label className="flex items-center space-x-1 cursor-pointer">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Auto-scroll</span>
          </label>
        </div>
      </div>
    </div>
  );
}
