// frontend/src/components/SystemStatus/SystemStatus.tsx
import React, { useState, useEffect } from 'react';
import './SystemStatus.css';

interface SystemStatusData {
  max_concurrent_executions: number;
  running_executions: number;
  queued_executions: number;
  total_projects: number;
  capacity_utilization: number;
  queue: Array<{
    project_id: string;
    priority: number;
    queued_at: string;
  }>;
  running: Array<{
    project_id: string;
    current_step?: string;
    progress?: number;
    started_at: string;
  }>;
}

interface SystemStatusProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemStatus: React.FC<SystemStatusProps> = ({ isOpen, onClose }) => {
  const [statusData, setStatusData] = useState<SystemStatusData | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchSystemStatus();
    }
  }, [isOpen]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (autoRefresh && isOpen) {
      interval = setInterval(fetchSystemStatus, 5000); // Refresh every 5 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, isOpen]);

  const fetchSystemStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/projects/system/status');
      const data = await response.json();
      
      if (data.success) {
        setStatusData(data.system);
      }
    } catch (error) {
      console.error('Failed to fetch system status:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (dateStr: string) => {
    const start = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMins % 60}m`;
    }
    return `${diffMins}m`;
  };

  const getCapacityColor = (utilization: number) => {
    if (utilization >= 90) return '#dc3545'; // Red
    if (utilization >= 70) return '#ffc107'; // Yellow
    return '#28a745'; // Green
  };

  const getPriorityBadge = (priority: number) => {
    if (priority >= 3) return { text: 'High', class: 'priority-high' };
    if (priority === 2) return { text: 'Medium', class: 'priority-medium' };
    return { text: 'Low', class: 'priority-low' };
  };

  if (!isOpen) return null;

  return (
    <div className="system-status-overlay">
      <div className="system-status-modal">
        <div className="status-header">
          <h3>System Status & Metrics</h3>
          <div className="status-controls">
            <label className="auto-refresh-toggle">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              Auto-refresh
            </label>
            
            <button 
              onClick={fetchSystemStatus}
              className="btn-secondary"
              disabled={loading}
              title="Refresh status"
            >
              {loading ? '⏳' : '🔄'}
            </button>
            
            <button 
              onClick={onClose}
              className="btn-close"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="status-content">
          {!statusData ? (
            <div className="status-loading">
              <p>Loading system status...</p>
            </div>
          ) : (
            <>
              {/* Overview Metrics */}
              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-value">{statusData.running_executions}</div>
                  <div className="metric-label">Running</div>
                </div>
                
                <div className="metric-card">
                  <div className="metric-value">{statusData.queued_executions}</div>
                  <div className="metric-label">Queued</div>
                </div>
                
                <div className="metric-card">
                  <div className="metric-value">{statusData.max_concurrent_executions}</div>
                  <div className="metric-label">Max Concurrent</div>
                </div>
                
                <div className="metric-card">
                  <div className="metric-value">{statusData.total_projects}</div>
                  <div className="metric-label">Total Projects</div>
                </div>
              </div>

              {/* Capacity Utilization */}
              <div className="capacity-section">
                <h4>Capacity Utilization</h4>
                <div className="capacity-bar">
                  <div 
                    className="capacity-fill"
                    style={{
                      width: `${statusData.capacity_utilization}%`,
                      backgroundColor: getCapacityColor(statusData.capacity_utilization)
                    }}
                  />
                </div>
                <div className="capacity-text">
                  {statusData.capacity_utilization.toFixed(1)}% utilized
                </div>
              </div>

              {/* Running Executions */}
              <div className="executions-section">
                <h4>Running Executions ({statusData.running.length})</h4>
                {statusData.running.length === 0 ? (
                  <div className="empty-state">No running executions</div>
                ) : (
                  <div className="executions-list">
                    {statusData.running.map((execution, index) => (
                      <div key={index} className="execution-item running">
                        <div className="execution-info">
                          <div className="execution-id">
                            🔄 {execution.project_id}
                          </div>
                          <div className="execution-details">
                            {execution.current_step && (
                              <span className="current-step">Step: {execution.current_step}</span>
                            )}
                            {execution.progress !== undefined && (
                              <span className="progress">Progress: {execution.progress}%</span>
                            )}
                          </div>
                        </div>
                        <div className="execution-duration">
                          {formatDuration(execution.started_at)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Execution Queue */}
              <div className="executions-section">
                <h4>Execution Queue ({statusData.queue.length})</h4>
                {statusData.queue.length === 0 ? (
                  <div className="empty-state">Queue is empty</div>
                ) : (
                  <div className="executions-list">
                    {statusData.queue.map((item, index) => (
                      <div key={index} className="execution-item queued">
                        <div className="execution-info">
                          <div className="execution-id">
                            ⏳ {item.project_id}
                          </div>
                          <div className="execution-details">
                            <span className="queue-position">Position: #{index + 1}</span>
                            <span className={`priority-badge ${getPriorityBadge(item.priority).class}`}>
                              {getPriorityBadge(item.priority).text}
                            </span>
                          </div>
                        </div>
                        <div className="execution-duration">
                          Queued {formatDuration(item.queued_at)} ago
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
