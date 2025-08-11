import React, { useState, useEffect } from 'react';
import { ChevronRight, X, Upload, Video, ExternalLink, AlertCircle } from 'lucide-react';
import { Node } from 'reactflow';

// Debug utility function
const debugLog = (component: string, action: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${component}] ${action}`, data || '');
};

// --- MOCK API & TYPE DEFINITIONS ---
// This section replaces external imports for a self-contained example.

interface FileData {
  fileId: string;
  filename: string;
  originalName: string;
  size: number;
  mimetype: string;
  status: string;
  uploadedAt: string;
}

interface NodeData {
  label: string;
  status?: 'configuring' | 'uploading' | 'ready' | 'error';
  selectedFile?: FileData;
  onDelete: (id: string) => void;
}

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// Mock file API for demonstration
const fileAPI = {
  validateVideoFile: (file: File): { valid: boolean; error?: string } => {
    debugLog('FileAPI', 'Validating video file', { 
      fileName: file.name, 
      fileSize: file.size, 
      fileType: file.type 
    });
    
    if (file.size > 500 * 1024 * 1024) { // 500MB limit
      debugLog('FileAPI', 'File validation failed - size too large', { 
        fileSize: file.size, 
        maxSize: 500 * 1024 * 1024 
      });
      return { valid: false, error: 'File exceeds 500MB limit.' };
    }
    
    debugLog('FileAPI', 'File validation passed');
    return { valid: true };
  },
  uploadFile: async (file: File, onProgress: (progress: UploadProgress) => void): Promise<{ data: FileData }> => {
    debugLog('FileAPI', 'Starting file upload', { 
      fileName: file.name, 
      fileSize: file.size 
    });
    
    // Simulate upload progress
    for (let p = 0; p <= 100; p += 10) {
      await new Promise(res => setTimeout(res, 50));
      const progress = { loaded: (file.size * p) / 100, total: file.size, percentage: p };
      onProgress(progress);
      debugLog('FileAPI', 'Upload progress', { percentage: p });
    }
    
    const fileId = `file-${Date.now()}`;
    const result = {
      data: {
        fileId,
        filename: `${fileId}.${file.name.split('.').pop()}`,
        originalName: file.name,
        size: file.size,
        mimetype: file.type,
        status: 'uploaded',
        uploadedAt: new Date().toISOString(),
      },
    };
    
    debugLog('FileAPI', 'File upload completed', { 
      fileId, 
      originalName: file.name 
    });
    
    return result;
  },
  getVideoStreamUrl: (fileId: string) => {
    const url = `http://localhost:4000/api/files/stream/${fileId}`;
    debugLog('FileAPI', 'Getting video stream URL', { fileId, url });
    return url;
  },
  formatFileSize: (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },
};


// --- COMPONENT IMPLEMENTATION ---

interface PropertiesPanelProps {
  selectedNode: Node<NodeData> | null;
  collapsed: boolean;
  onToggle: () => void;
  onNodeUpdate: (nodeId: string, newData: Partial<NodeData>) => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedNode,
  collapsed,
  onToggle,
  onNodeUpdate
}) => {
  debugLog('PropertiesPanel', 'Component rendered', { 
    hasSelectedNode: !!selectedNode, 
    nodeId: selectedNode?.id,
    collapsed 
  });
  
  const [nodeName, setNodeName] = useState('');
  const [isLive, setIsLive] = useState(false);
  const [rtspUrl, setRtspUrl] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const isVideoStream = selectedNode?.id?.includes('video-stream');
  const [showVideoModal, setShowVideoModal] = useState(false);

  // Effect to reset and initialize state when a new node is selected
  useEffect(() => {
    if (selectedNode) {
      debugLog('PropertiesPanel', 'Node selected, initializing state', { 
        nodeId: selectedNode.id,
        nodeType: selectedNode.data?.label 
      });
      
      setNodeName(selectedNode.data?.label || '');
      setIsLive(selectedNode.data?.isLive || false);
      setRtspUrl(selectedNode.data?.rtspUrl || '');
      setSelectedFile(selectedNode.data?.selectedFile || null);
      setVideoFile(null);
      setPreviewUrl(null);
      setUploadProgress(null);
      setUploading(false);
      setUploadError(null);
    } else {
      debugLog('PropertiesPanel', 'No node selected, clearing state');
      setNodeName('');
      setIsLive(false);
      setRtspUrl('');
      setSelectedFile(null);
      setVideoFile(null);
      setPreviewUrl(null);
      setUploadProgress(null);
      setUploading(false);
      setUploadError(null);
    }
  }, [selectedNode]);

  // Keyboard shortcut handler
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        debugLog('PropertiesPanel', 'Escape key pressed, closing video modal');
        setShowVideoModal(false);
      }
    };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      debugLog('PropertiesPanel', 'No file selected in file input');
      return;
    }

    debugLog('PropertiesPanel', 'File selected', { 
      fileName: file.name, 
      fileSize: file.size, 
      fileType: file.type 
    });

    // Validate file
    const validation = fileAPI.validateVideoFile(file);
    if (!validation.valid) {
      debugLog('PropertiesPanel', 'File validation failed', { error: validation.error });
      setUploadError(validation.error);
      return;
    }

    setVideoFile(file);
    setUploadError(null);
    setUploading(true);
    setUploadProgress({ loaded: 0, total: file.size, percentage: 0 });

    try {
      const result = await fileAPI.uploadFile(file, (progress) => {
        debugLog('PropertiesPanel', 'Upload progress update', { 
          percentage: progress.percentage,
          loaded: progress.loaded,
          total: progress.total
        });
        setUploadProgress(progress);
      });

      debugLog('PropertiesPanel', 'File upload completed successfully', { 
        fileId: result.data.fileId,
        originalName: result.data.originalName
      });

      setSelectedFile(result.data);
      setUploading(false);
      setUploadProgress(null);

      // Update node data
      if (selectedNode) {
        debugLog('PropertiesPanel', 'Updating node with uploaded file', { 
          nodeId: selectedNode.id,
          fileId: result.data.fileId 
        });
        onNodeUpdate(selectedNode.id, {
          selectedFile: result.data,
          status: 'ready'
        });
      }

      // Create preview URL
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);
      debugLog('PropertiesPanel', 'Preview URL created', { previewUrl: preview });

    } catch (error) {
      debugLog('PropertiesPanel', 'File upload failed', { error });
      setUploadError('Upload failed. Please try again.');
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const handleNodeNameChange = (value: string) => {
    debugLog('PropertiesPanel', 'Node name changed', { 
      nodeId: selectedNode?.id, 
      oldName: nodeName, 
      newName: value 
    });
    setNodeName(value);
    if (selectedNode) {
      onNodeUpdate(selectedNode.id, { label: value });
    }
  };

  const handleLiveToggle = (value: boolean) => {
    debugLog('PropertiesPanel', 'Live toggle changed', { 
      nodeId: selectedNode?.id, 
      isLive: value 
    });
    setIsLive(value);
    if (selectedNode) {
      onNodeUpdate(selectedNode.id, { isLive: value });
    }
  };

  const handleRtspUrlChange = (value: string) => {
    debugLog('PropertiesPanel', 'RTSP URL changed', { 
      nodeId: selectedNode?.id, 
      rtspUrl: value 
    });
    setRtspUrl(value);
    if (selectedNode) {
      onNodeUpdate(selectedNode.id, { rtspUrl: value });
    }
  };

  const handleRemoveFile = () => {
    debugLog('PropertiesPanel', 'Removing selected file', { 
      nodeId: selectedNode?.id,
      fileId: selectedFile?.fileId 
    });
    setSelectedFile(null);
    setPreviewUrl(null);
    if (selectedNode) {
      onNodeUpdate(selectedNode.id, { selectedFile: undefined, status: 'empty' });
    }
  };

  const handlePreviewVideo = () => {
    debugLog('PropertiesPanel', 'Opening video preview modal');
    setShowVideoModal(true);
  };

  if (collapsed) {
    return (
      <div className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10">
        <button
          onClick={onToggle}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-l-lg p-2 shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
      </div>
    );
  }

  if (!selectedNode) {
    debugLog('PropertiesPanel', 'No node selected, showing empty state');
    return (
      <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-6 overflow-y-auto">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p>Select a node to configure its properties</p>
        </div>
      </div>
    );
  }

  debugLog('PropertiesPanel', 'Rendering properties panel', { 
    nodeId: selectedNode.id,
    nodeType: selectedNode.data?.label,
    hasFile: !!selectedFile,
    isLive,
    hasRtspUrl: !!rtspUrl
  });

  return (
    <>
      <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Properties
          </h3>
          <button
            onClick={onToggle}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Node Name */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Node Name
          </label>
          <input
            type="text"
            value={nodeName}
            onChange={(e) => handleNodeNameChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
            placeholder="Enter node name"
          />
        </div>

        {/* Video Stream Specific Properties */}
        {isVideoStream && (
          <>
            {/* Live Stream Toggle */}
            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isLive}
                  onChange={(e) => handleLiveToggle(e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 shadow-sm focus:border-purple-300 focus:ring focus:ring-purple-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Live Stream
                </span>
              </label>
            </div>

            {/* RTSP URL Input */}
            {isLive && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  RTSP URL
                </label>
                <input
                  type="text"
                  value={rtspUrl}
                  onChange={(e) => handleRtspUrlChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                  placeholder="rtsp://example.com/stream"
                />
              </div>
            )}

            {/* File Upload */}
            {!isLive && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Video File
                </label>
                
                {!selectedFile ? (
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <label className="cursor-pointer bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors">
                        Choose Video File
                        <input
                          type="file"
                          accept="video/*"
                          onChange={handleFileChange}
                          className="hidden"
                          disabled={uploading}
                        />
                      </label>
                    </div>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      MP4, AVI, MOV up to 500MB
                    </p>
                  </div>
                ) : (
                  <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Video className="h-8 w-8 text-purple-600" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {selectedFile.originalName}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {fileAPI.formatFileSize(selectedFile.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleRemoveFile}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="mt-3 flex space-x-2">
                      <button
                        onClick={handlePreviewVideo}
                        className="flex-1 bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 transition-colors"
                      >
                        Preview
                      </button>
                      <button
                        onClick={() => window.open(fileAPI.getVideoStreamUrl(selectedFile.fileId), '_blank')}
                        className="flex-1 bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 transition-colors flex items-center justify-center"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Stream
                      </button>
                    </div>
                  </div>
                )}

                {/* Upload Progress */}
                {uploading && uploadProgress && (
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <span>Uploading...</span>
                      <span>{uploadProgress.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress.percentage}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Upload Error */}
                {uploadError && (
                  <div className="mt-4 flex items-center p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
                    <span className="text-sm text-red-600 dark:text-red-400">{uploadError}</span>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Video Preview Modal */}
      {showVideoModal && previewUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Video Preview
              </h3>
              <button
                onClick={() => setShowVideoModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <video
              controls
              className="w-full rounded-lg"
              src={previewUrl}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      )}
    </>
  );
};

export default PropertiesPanel;
