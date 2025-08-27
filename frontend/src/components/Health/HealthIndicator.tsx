// src/components/Health/HealthIndicator.tsx
import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { HealthStatus } from '../../types/health.types';

interface HealthIndicatorProps {
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const HealthIndicator: React.FC<HealthIndicatorProps> = ({ 
  showText = true, 
  size = 'md',
  className = '' 
}) => {
  const { status, loading, error } = useSelector((state: RootState) => state.health);

  const getStatusColor = (healthStatus: HealthStatus['status'] | null) => {
    switch (healthStatus) {
      case 'healthy':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'unhealthy':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = (healthStatus: HealthStatus['status'] | null) => {
    if (loading) return 'Checking...';
    if (error) return 'Error';
    switch (healthStatus) {
      case 'healthy':
        return 'All Systems Operational';
      case 'degraded':
        return 'Some Issues Detected';
      case 'unhealthy':
        return 'System Issues';
      default:
        return 'Status Unknown';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-2 h-2';
      case 'lg':
        return 'w-4 h-4';
      default:
        return 'w-3 h-3';
    }
  };

  const getTooltipText = () => {
    if (loading) return 'Checking system health...';
    if (error) return `Health check failed: ${error}`;
    if (!status) return 'Health status unavailable';
    
    return `System Status: ${getStatusText(status.status)}
Last Updated: ${new Date(status.timestamp).toLocaleTimeString()}
Response Time: ${status.responseTime}ms`;
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`} title={getTooltipText()}>
      <div className={`rounded-full ${getStatusColor(status?.status || null)} ${getSizeClasses()}`}>
        {loading && (
          <div className="animate-pulse w-full h-full rounded-full bg-gray-300"></div>
        )}
      </div>
      {showText && (
        <span className={`text-sm ${
          status?.status === 'healthy' ? 'text-green-600 dark:text-green-400' :
          status?.status === 'degraded' ? 'text-yellow-600 dark:text-yellow-400' :
          status?.status === 'unhealthy' ? 'text-red-600 dark:text-red-400' :
          'text-gray-600 dark:text-gray-400'
        }`}>
          {getStatusText(status?.status || null)}
        </span>
      )}
    </div>
  );
};

export default HealthIndicator;
