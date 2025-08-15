// frontend/src/components/ExecutionLogs/ExecutionLogs.tsx
import React, { useState, useEffect, useRef } from 'react';
import './ExecutionLogs.css';

interface ExecutionLogsProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
}

export const ExecutionLogs: React.FC<ExecutionLogsProps> = ({ 
  projectId, 
  isOpen, 
  onClose 
}) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Fetch initial logs
  useEffect(() => {
    if (isOpen && projectId) {
      fetchLogs();
    }
  }, [isOpen, projectId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll) {
      scrollToBottom();
    }
  }, [logs, autoScroll]);

  const fetchLogs = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/logs`);
      const data = await response.json();
      
      if (data.success) {
        const parsedLogs = data.logs
          .filter((line: string) => line.trim())
          .map((line: string) => parseLogLine(line));
        
        setLogs(parsedLogs);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    }
  };

  const startLogStream = () => {
    if (eventSourceRef.current) return;

    setIsStreaming(true);
    const eventSource = new EventSource(`/api/projects/${projectId}/logs?stream=true`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const logData = JSON.parse(event.data);
        const newLog = parseLogLine(logData.message);
        
        setLogs(prev => [...prev, newLog]);
      } catch (error) {
        console.error('Failed to parse log message:', error);
      }
    };

    eventSource.onerror = () => {
      console.error('Log stream error');
      stopLogStream();
    };
  };

  const stopLogStream = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsStreaming(false);
  };

  const parseLogLine = (logLine: string): LogEntry => {
    // Parse log format: "2025-08-15T16:03:32Z: [LEVEL] message"
    const match = logLine.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z):\s*(?:\[(\w+)\])?\s*(.*)$/);
    
    if (match) {
      return {
        timestamp: match[1],
        level: match[2] || 'INFO',
        message: match[3]
      };
    }

    return {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message: logLine
    };
  };

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const downloadLogs = () => {
    const logText = logs
      .map(log => `${log.timestamp} [${log.level}] ${log.message}`)
      .join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectId}-execution.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getLevelClass = (level: string) => {
    switch (level.toUpperCase()) {
      case 'ERROR': return 'log-error';
      case 'WARN': case 'WARNING': return 'log-warning';
      case 'INFO': return 'log-info';
      case 'DEBUG': return 'log-debug';
      default: return 'log-info';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="execution-logs-overlay">
      <div className="execution-logs-modal">
        <div className="logs-header">
          <h3>Execution Logs - {projectId}</h3>
          <div className="logs-controls">
            <button 
              onClick={fetchLogs}
              className="btn-secondary"
              title="Refresh logs"
            >
              🔄
            </button>
            
            <button 
              onClick={isStreaming ? stopLogStream : startLogStream}
              className={`btn-secondary ${isStreaming ? 'streaming' : ''}`}
              title={isStreaming ? "Stop streaming" : "Start streaming"}
            >
              {isStreaming ? '⏸️ Stop' : '▶️ Stream'}
            </button>
            
            <label className="auto-scroll-toggle">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
              />
              Auto-scroll
            </label>
            
            <button 
              onClick={clearLogs}
              className="btn-secondary"
              title="Clear logs"
            >
              🗑️
            </button>
            
            <button 
              onClick={downloadLogs}
              className="btn-secondary"
              title="Download logs"
            >
              📥
            </button>
            
            <button 
              onClick={onClose}
              className="btn-close"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="logs-container">
          {logs.length === 0 ? (
            <div className="logs-empty">
              <p>No logs available</p>
              <button onClick={fetchLogs} className="btn-primary">
                Load Logs
              </button>
            </div>
          ) : (
            <div className="logs-content">
              {logs.map((log, index) => (
                <div key={index} className={`log-entry ${getLevelClass(log.level)}`}>
                  <span className="log-timestamp">
                    {formatTimestamp(log.timestamp)}
                  </span>
                  <span className="log-level">
                    [{log.level}]
                  </span>
                  <span className="log-message">
                    {log.message}
                  </span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>

        <div className="logs-footer">
          <span className="logs-count">
            {logs.length} log entries
          </span>
          {isStreaming && (
            <span className="streaming-indicator">
              🔴 Live streaming
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
