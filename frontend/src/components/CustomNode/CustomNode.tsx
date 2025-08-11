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

// Debug utility function
const debugLog = (component: string, action: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${component}] ${action}`, data || '');
};

interface CustomNodeProps {
  data: NodeData & {
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
    hasError?: boolean;
  };
  id: string;
}

const CustomNode: React.FC<NodeProps<NodeData>> = ({ data, id, ...props }) => {
  debugLog('CustomNode', 'Component rendered', { 
    nodeId: id, 
    nodeType: data.label,
    status: data.status,
    hasError: data.hasError,
    hasFile: !!data.selectedFile,
    isLive: data.isLive
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    debugLog('CustomNode', 'Delete button clicked', { nodeId: id });
    if (data.onDelete) {
      data.onDelete(id);
    }
  };

  // Determine node status and styling
  const getNodeStatus = () => {
    debugLog('CustomNode', 'Getting node status', { 
      nodeId: id, 
      status: data.status 
    });
    
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

  debugLog('CustomNode', 'Rendering node', { 
    nodeId: id,
    status: nodeStatus.statusText,
    hasError: data.hasError
  });

  return (
    <div className="relative group min-w-[180px] max-w-[220px]">
      {/* Delete button - existing */}
      <button
        onClick={handleDelete}
        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center justify-center hover:bg-red-600"
        title="Delete node"
      >
        <Trash2 className="w-3 h-3" />
      </button>

      {/* Error/Warning icon - NEW: positioned on the edge like delete button */}
      {data.hasError && (
        <div className="absolute -top-2 -left-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center z-10">
          <AlertCircle className="w-3 h-3" />
        </div>
      )}

      {/* Main node content */}
      <div className={`border-2 rounded-lg p-3 bg-white shadow-sm ${nodeStatus.color} ${data.hasError ? 'border-red-500' : ''}`}>
        {/* Node header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {data.label.includes('Video Stream') ? (
              <Video className="w-4 h-4 text-blue-600" />
            ) : (
              <Play className="w-4 h-4 text-purple-600" />
            )}
            <span className="text-sm font-medium text-gray-900 truncate">
              {data.label}
            </span>
          </div>
          {nodeStatus.icon}
        </div>

        {/* Node content based on type */}
        {data.label.includes('Video Stream') && (
          <div className="space-y-2">
            {/* Status indicator */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">{nodeStatus.statusText}</span>
              {data.isLive && (
                <div className="flex items-center space-x-1">
                  <Wifi className="w-3 h-3 text-green-500" />
                  <span className="text-green-600">Live</span>
                </div>
              )}
            </div>

            {/* File info or RTSP info */}
            {data.selectedFile ? (
              <div className="bg-gray-50 rounded p-2">
                <div className="flex items-center space-x-1 mb-1">
                  <FileVideo className="w-3 h-3 text-gray-500" />
                  <span className="text-xs font-medium text-gray-700">File</span>
                </div>
                <p className="text-xs text-gray-600 truncate">
                  {data.selectedFile.originalName}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(data.selectedFile.size)}
                </p>
              </div>
            ) : data.rtspUrl ? (
              <div className="bg-gray-50 rounded p-2">
                <div className="flex items-center space-x-1 mb-1">
                  <Wifi className="w-3 h-3 text-green-500" />
                  <span className="text-xs font-medium text-gray-700">RTSP</span>
                </div>
                <p className="text-xs text-gray-600 truncate">
                  {data.rtspUrl}
                </p>
              </div>
            ) : (
              <div className="bg-gray-50 rounded p-2">
                <p className="text-xs text-gray-500 text-center">
                  {data.isLive ? 'Configure RTSP URL' : 'Upload video file'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Generic node content */}
        {!data.label.includes('Video Stream') && (
          <div className="text-xs text-gray-600">
            <p>Configure node settings</p>
          </div>
        )}
      </div>

      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-gray-400 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-gray-400 border-2 border-white"
      />
    </div>
  );
};

export default CustomNode;
