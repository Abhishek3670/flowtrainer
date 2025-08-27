// frontend/src/components/PropertiesPanel/PropertiesPanel.tsx

import React, { useState, useEffect } from 'react';
import { ChevronRight, Video, CheckCircle, AlertCircle, X, ExternalLink } from 'lucide-react';
import { Node } from 'reactflow';
import { NodeData, FileData, UploadProgress } from '../../types';
import { fileAPI } from '../../services/fileApi';
import { NodeConfiguratorFactory } from './NodeConfigurators/factory';
import GenericConfigurator from './NodeConfigurators/GenericConfigurator';
import FileUploadSection from '../Shared/FileUploadSection';

interface PropertiesPanelProps {
  selectedNode: Node<NodeData> | null;
  collapsed?: boolean;
  onNodeUpdate: (nodeId: string, newData: Partial<NodeData>) => void;
  isOpen?: boolean;
  onClose?: () => void;
  onToggle?: () => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedNode,
  collapsed = false,
  onNodeUpdate,
}) => {
  // Early returns for collapsed state or no selection
  if (collapsed) {
    return (
      <div className="p-4 text-gray-500 dark:text-gray-400">
        <div className="flex items-center space-x-2">
          <ChevronRight className="w-4 h-4" />
          <span>Properties collapsed</span>
        </div>
      </div>
    );
  }

  if (!selectedNode) {
    return (
      <div className="p-4 text-gray-500 dark:text-gray-400 text-center">
        <div className="space-y-2">
          <div className="w-12 h-12 mx-auto bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <ChevronRight className="w-6 h-6" />
          </div>
          <p>Select a node to view its properties</p>
        </div>
      </div>
    );
  }

  console.log('[PropertiesPanel] Selected node:', selectedNode);
  console.log('[PropertiesPanel] Node data:', selectedNode.data);

  // Extract nodeType from the selected node
  const nodeType = selectedNode.data.nodeType || selectedNode.data.type;
  console.log('[PropertiesPanel] Extracted nodeType:', nodeType);

  // Handle video-stream nodes with the existing legacy logic
  if (nodeType === 'video-stream') {
    return <VideoStreamProperties node={selectedNode} onNodeUpdate={onNodeUpdate} />;
  }

  // For all other node types, try to use the configurator factory
  try {
    // Clean the node type (remove any trailing numbers like -1, -2, etc.)
    const cleanNodeType = typeof nodeType === 'string' ? nodeType.replace(/-\d+$/, '') : String(nodeType);
    console.log('[PropertiesPanel] Clean nodeType:', cleanNodeType);

    const Configurator = NodeConfiguratorFactory.getConfigurator(cleanNodeType);
    console.log('[PropertiesPanel] Found configurator:', !!Configurator);

    if (Configurator) {
      return (
        <div className="h-full overflow-y-auto">
          <Configurator node={selectedNode} onNodeUpdate={onNodeUpdate} />
        </div>
      );
    }
  } catch (error) {
    console.warn('[PropertiesPanel] Error getting configurator:', error);
  }

  // Fallback: Use your existing GenericConfigurator for unknown node types
  return (
    <div className="h-full overflow-y-auto p-4">
      <GenericConfigurator node={selectedNode} onNodeUpdate={onNodeUpdate} />
    </div>
  );
};

// Legacy video stream properties component
const VideoStreamProperties: React.FC<{
  node: Node<NodeData>;
  onNodeUpdate: (nodeId: string, newData: Partial<NodeData>) => void;
}> = ({ node, onNodeUpdate }) => {
  const [nodeName, setNodeName] = useState(node.data.label || '');
  const [isLive, setIsLive] = useState(!!node.data.isLive);
  const [rtspUrl, setRtspUrl] = useState(node.data.rtspUrl || '');
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileData | null>(node.data.selectedFile || null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    setNodeName(node.data.label || '');
    setIsLive(!!node.data.isLive);
    setRtspUrl(node.data.rtspUrl || '');
    setSelectedFile(node.data.selectedFile || null);
    setUploadError(null);
    setUploadSuccess(null);
    setVideoFile(null);
    setPreviewUrl(null);
    setUploadProgress(null);
  }, [node]);

  useEffect(() => {
    const handler = setTimeout(() => {
      onNodeUpdate(node.id, { label: nodeName });
    }, 500);
    return () => clearTimeout(handler);
  }, [nodeName, node.id, onNodeUpdate]);

  useEffect(() => {
    const handler = setTimeout(() => {
      onNodeUpdate(node.id, { isLive, rtspUrl });
    }, 500);
    return () => clearTimeout(handler);
  }, [isLive, rtspUrl, node.id, onNodeUpdate]);

  useEffect(() => {
    if (!videoFile) return;
    const url = URL.createObjectURL(videoFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [videoFile]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement> | File) => {
    let file: File | undefined;
    if ('target' in e) {
      file = e.target.files?.[0];
    } else {
      file = e;
    }
    if (!file) return;

    setVideoFile(file);
    setUploading(true);
    onNodeUpdate(node.id, { status: 'uploading' });

    try {
      const resp = await fileAPI.uploadFile(file, setUploadProgress);
      const data = resp.data!;
      setSelectedFile(data);
      onNodeUpdate(node.id, { selectedFile: data, status: 'ready' });
      setUploadSuccess(`Uploaded "${file.name}"`);
      setUploadError(null);
    } catch (err: any) {
      onNodeUpdate(node.id, { status: 'error' });
      setUploadError(err.message);
      setUploadSuccess(null);
    } finally {
      setUploading(false);
      setUploadProgress(null);
      if ('target' in e) e.target.value = '';
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setVideoFile(null);
    setUploadError(null);
    setUploadSuccess(null);
    setPreviewUrl(null);
    onNodeUpdate(node.id, { selectedFile: undefined, status: 'empty' });
  };

  return (
    <div className="h-full bg-white dark:bg-gray-800 overflow-y-auto p-4 space-y-6">
      {/* Node Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Node Name</label>
        <input
          type="text"
          value={nodeName}
          onChange={e => setNodeName(e.target.value)}
          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
          placeholder="Enter node name..."
        />
      </div>

      {/* Video Source */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Video Source</h3>

        {/* Live Toggle */}
        <div className="mb-4">
          <label className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            <div className="flex items-center space-x-3">
              <Video className="w-5 h-5 text-red-500" />
              <div>
                <span className="text-sm font-medium">Use Live RTSP Stream</span>
                <p className="text-xs text-gray-500 dark:text-gray-400">Stream from cameras or live sources</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isLive}
              onChange={e => setIsLive(e.target.checked)}
              className="h-4 w-4 text-blue-600"
            />
          </label>
        </div>

        {/* File Upload Section */}
        <FileUploadSection
          label="Upload Video File"
          accept="video/*,.mp4,.mov,.avi"
          maxSize={500 * 1024 * 1024}
          uploadProgress={uploadProgress}
          onFileSelect={handleFileChange}
          disabled={uploading || isLive}
        />

        {/* Success and Error Messages */}
        {uploadSuccess && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3 flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-700 dark:text-green-400">{uploadSuccess}</span>
            <button onClick={() => setUploadSuccess(null)} className="ml-auto text-green-500 hover:text-green-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {uploadError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3 flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-700 dark:text-red-400">{uploadError}</span>
            <button onClick={() => setUploadError(null)} className="ml-auto text-red-500 hover:text-red-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Video Preview */}
        {(previewUrl || selectedFile) && !uploading && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-900 dark:text-white">Preview</span>
              <span
                className={`text-xs px-2 py-1 rounded ${
                  selectedFile
                    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                    : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                }`}
              >
                {selectedFile ? 'Uploaded' : 'Local Preview'}
              </span>
            </div>
            <video
              className="w-full rounded-lg shadow-sm"
              controls
              style={{ maxHeight: '200px' }}
              src={selectedFile ? fileAPI.getVideoStreamUrl(selectedFile.fileId) : previewUrl || undefined}
            >
              Your browser does not support video preview.
            </video>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400 truncate pr-2">
                {selectedFile ? selectedFile.originalName : videoFile?.name}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                {selectedFile ? fileAPI.formatFileSize(selectedFile.size) : videoFile ? fileAPI.formatFileSize(videoFile.size) : ''}
              </span>
            </div>
            {selectedFile && (
              <div className="mt-3 flex justify-center">
                <button
                  onClick={clearFile}
                  className="text-sm bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-3 py-1 rounded-md hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                >
                  Remove File
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* RTSP URL */}
      <div className={`transition-all duration-300 ease-in-out ${!isLive ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">RTSP Stream URL</label>
        <div className="relative">
          <input
            type="url"
            value={rtspUrl}
            onChange={e => setRtspUrl(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
            placeholder="rtsp://example.com:554/stream"
            disabled={!isLive}
          />
          <ExternalLink className="absolute right-3 top-3.5 w-4 h-4 text-gray-400" />
        </div>
        {rtspUrl && isLive && (
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-orange-700 dark:text-orange-400 font-medium">RTSP Stream Configured</span>
            </div>
            <p className="text-xs text-orange-600 dark:text-orange-500 mt-1">Ready to connect to live stream</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertiesPanel;