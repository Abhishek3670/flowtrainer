// src/components/Health/ConnectionStatus.tsx
import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

interface ConnectionStatusProps {
  className?: string;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ className = '' }) => {
  const { connectionStatus } = useSelector((state: RootState) => state.health);

  const getConnectionIcon = () => {
    switch (connectionStatus.connectionType) {
      case 'socket':
        return '🟢';
      case 'polling':
        return '🟡';
      case 'offline':
        return '🔴';
      default:
        return '⚪';
    }
  };

  const getConnectionText = () => {
    if (connectionStatus.isConnected) {
      return connectionStatus.connectionType === 'socket' 
        ? 'Real-time connection active' 
        : 'Connected via polling';
    }
    return connectionStatus.reconnectAttempts > 0 
      ? `Reconnecting... (${connectionStatus.reconnectAttempts})` 
      : 'Offline';
  };

  const getTooltipText = () => {
    return `Connection: ${getConnectionText()}
Type: ${connectionStatus.connectionType}
${connectionStatus.lastConnected ? `Last connected: ${new Date(connectionStatus.lastConnected).toLocaleString()}` : ''}`;
  };

  return (
    <div 
      className={`flex items-center space-x-1 text-xs ${className}`}
      title={getTooltipText()}
    >
      <span>{getConnectionIcon()}</span>
      <span className="text-gray-600 dark:text-gray-400">
        {getConnectionText()}
      </span>
    </div>
  );
};

export default ConnectionStatus;
