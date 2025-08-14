import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import {
  Trash2,
  Play,
  Video,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileVideo,
  Wifi,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { NodeData } from '../../types';

const CustomNode: React.FC<NodeProps<NodeData>> = ({ data, id }) => {

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data?.onDelete) {
      data.onDelete(id);
    }
  };

  // Ensure data exists
  if (!data) {
    console.warn('CustomNode: No data provided for node:', id);
    return (
      <div className="w-60 h-32 p-3 rounded-lg border-2 border-red-500 bg-red-50 flex flex-col shadow-sm node-glow-red transition-all duration-300">
        <div className="text-red-800 text-sm truncate">Invalid Node: {id}</div>
        <Handle type="target" position={Position.Left} className="w-2 h-2 bg-gray-400 border-2 border-white" />
        <Handle type="source" position={Position.Right} className="w-2 h-2 bg-blue-500 border-2 border-white" />
      </div>
    );
  }

  // Determine node status and styling with all-around hover glow effects
  const getNodeStatus = () => {
    switch (data.status) {
      case 'uploading':
        return {
          icon: <Loader2 className="w-3 h-3 animate-spin text-blue-500" />,
          color: 'border-blue-500 bg-blue-50',
          glowClass: 'node-glow-blue',
          statusText: 'Uploading'
        };
      case 'ready':
        return {
          icon: <CheckCircle className="w-3 h-3 text-green-500" />,
          color: 'border-green-500 bg-green-50',
          glowClass: 'node-glow-green',
          statusText: 'Ready'
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-3 h-3 text-red-500" />,
          color: 'border-red-500 bg-red-50',
          glowClass: 'node-glow-red',
          statusText: 'Error'
        };
      case 'configuring':
        return {
          icon: <Clock className="w-3 h-3 text-yellow-500" />,
          color: 'border-yellow-500 bg-yellow-50',
          glowClass: 'node-glow-yellow',
          statusText: 'Configuring'
        };
      default:
        return {
          icon: <AlertTriangle className="w-3 h-3 text-gray-500" />,
          color: 'border-gray-300 bg-gray-50',
          glowClass: 'node-glow-gray',
          statusText: 'Empty'
        };
    }
  };

  // Get main icon based on node type
  const getMainIcon = () => {
    switch (data.nodeType) {
      case 'video-stream':
        return data.isLive ? <Wifi className="w-4 h-4" /> : <FileVideo className="w-4 h-4" />;
      case 'data-processor':
        return <Play className="w-4 h-4" />;
      default:
        return <Video className="w-4 h-4" />;
    }
  };

  const nodeStatus = getNodeStatus();

  return (
    <div 
      className={`
        relative w-60 h-32 p-3 rounded-lg border-2 shadow-sm group
        bg-white dark:bg-gray-800 transition-all duration-300
        ${nodeStatus.color}
        ${nodeStatus.glowClass}
        ${data.hasError ? 'node-glow-red-error' : ''}
        flex flex-col overflow-hidden
      `}
    >
      {/* Delete Button - Enhanced Visibility */}
      <button
        onClick={handleDelete}
        className="absolute -top-2 -right-2 w-7 h-7 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 shadow-lg shadow-red-500/50 hover:shadow-red-500/70 hover:scale-110"
        title="Delete node"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>

      {/* Error indicator */}
      {data.hasError && (
        <div className="absolute -top-1 -left-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
      )}

      {/* Node Header */}
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <div className="text-blue-600 dark:text-blue-400 flex-shrink-0">
            {getMainIcon()}
          </div>
          <span className="font-medium text-sm text-gray-900 dark:text-white truncate">
            {data.label || data.nodeType || 'Untitled'}
          </span>
        </div>
        <div className="flex items-center space-x-1 flex-shrink-0">
          {nodeStatus.icon}
        </div>
      </div>

      {/* Node Content - Scrollable */}
      <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
        {/* Node Name */}
        {data.nodeName && (
          <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
            Name: {data.nodeName}
          </div>
        )}

        {/* File Information */}
        {data.selectedFile && (
          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <div className="flex items-center space-x-1 min-w-0">
              <FileVideo className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{data.selectedFile.originalName}</span>
            </div>
            <div className="text-gray-500">
              {(data.selectedFile.size / (1024 * 1024)).toFixed(1)} MB
            </div>
          </div>
        )}

        {/* RTSP Information */}
        {data.isLive && data.rtspUrl && (
          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <div className="flex items-center space-x-1">
              <Wifi className="w-3 h-3 flex-shrink-0" />
              <span>Live Stream</span>
            </div>
            <div className="text-gray-500 truncate" title={data.rtspUrl}>
              {data.rtspUrl}
            </div>
          </div>
        )}
      </div>

      {/* Status Footer */}
      <div className="flex items-center justify-between pt-1 mt-2 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
        <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {nodeStatus.statusText}
        </span>
        {data.status === 'uploading' && (
          <div className="text-xs text-blue-600 flex-shrink-0">Processing...</div>
        )}
      </div>

      {/* Connection Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-2 h-2 bg-gray-400 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-2 h-2 bg-blue-500 border-2 border-white"
      />
    </div>
  );
};

export default CustomNode;
