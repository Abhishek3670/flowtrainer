import React from 'react';
import { Handle, Position } from 'reactflow';
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
import { NodeProps } from 'reactflow';
import { NodeData } from '../../services/workflowApi';
interface CustomNodeProps {
  data: {
    label: string;
    nodeName?: string;
    isLive?: boolean;
    rtspUrl?: string;
    selectedFile?: {
      fileId: string;
      filename: string;
      originalName: string;
      size: number;
      mimetype: string;
      uploadedAt: string;
    };
    status?: 'empty' | 'ready' | 'processing' | 'error';
    onDelete?: (nodeId: string) => void;
  };
  id: string;
}

const CustomNode: React.FC<NodeProps<NodeData>> = ({ data, id }) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.onDelete) {
      data.onDelete(id);
    }
  };

  // Determine node status and styling
  const getNodeStatus = () => {
    switch (data.status) {
      case 'uploading':
        return {
          icon: <Loader2 className="w-3 h-3 animate-spin text-blue-500" />,
          color: 'border-blue-500 bg-blue-50',
          statusText: 'Uploading'
        };
      case 'ready':
        return {
          icon: <CheckCircle className="w-3 h-3 text-green-500" />,
          color: 'border-green-500 bg-green-50',
          statusText: 'Ready'
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-3 h-3 text-red-500" />,
          color: 'border-red-500 bg-red-50',
          statusText: 'Error'
        };
      default: // 'empty'
        return {
          icon: <AlertTriangle className="w-3 h-3 text-orange-500" />,
          color: 'border-orange-500 bg-orange-50',
          statusText: 'Empty'
        };
    }
  };


  const nodeStatus = getNodeStatus();

  // Format file size helper
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className={`relative group min-w-[180px] max-w-[220px]`}>
      {/* Delete button */}
      <button
        onClick={handleDelete}
        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center justify-center hover:bg-red-600"
        title="Delete node"
      >
        <Trash2 className="w-3 h-3" />
      </button>

      {/* Main node container */}
      <div className={`border-2 rounded-lg p-3 bg-white dark:bg-gray-800 shadow-sm transition-all ${nodeStatus.color}`}>
        {/* Node header */}
        <div className="flex items-center space-x-2 mb-2">
          <div className="flex items-center space-x-1">
            {nodeStatus.icon}
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              {nodeStatus.statusText}
            </span>
          </div>
        </div>

        {/* Node title */}
        <div className="mb-2">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
            {data.label}
          </h3>
          {data.nodeName && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {data.nodeName}
            </p>
          )}
        </div>

        {/* File/Stream info */}
        <div className="space-y-1">
          {data.isLive && data.rtspUrl ? (
            <div className="text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Live RTSP Stream</span>
              </div>
              <div className="truncate mt-1 font-mono text-xs">
                {data.rtspUrl}
              </div>
            </div>
          ) : data.selectedFile ? (
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <div className="flex items-center space-x-1">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span className="truncate font-medium">
                  {data.selectedFile.originalName}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{formatFileSize(data.selectedFile.size)}</span>
                <span className="text-green-600">Ready</span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-orange-600 dark:text-orange-400 flex items-center space-x-1">
              <AlertTriangle className="w-3 h-3" />
              <span>Configure input source</span>
            </div>
          )}
        </div>

        {/* Processing status indicator */}
        {data.status === 'uploading' && (
          <div className="mt-2 flex items-center space-x-1 text-xs text-blue-600">
            <Clock className="w-3 h-3 animate-spin" />
            <span>Processing...</span>
          </div>
        )}
      </div>

      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-gray-400 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-gray-400 border-2 border-white"
      />
    </div>
  );
};

export default CustomNode;
