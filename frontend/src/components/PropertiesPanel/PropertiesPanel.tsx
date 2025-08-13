import React, { useState, useEffect } from 'react';
import { ChevronRight, X, Upload, Video, ExternalLink, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Node } from 'reactflow';
import { NodeData, FileData, UploadProgress } from '../../types';
import { fileAPI } from '../../services/fileApi';

interface PropertiesPanelProps {
  selectedNode: Node<NodeData> | null;
  collapsed?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  onToggle?: () => void;
  onNodeUpdate: (nodeId: string, newData: Partial<NodeData>) => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedNode,
  collapsed = false,
  onNodeUpdate,
  /* onClose */
}) => {
  const [nodeName, setNodeName] = useState('');
  const [isLive, setIsLive] = useState(false);
  const [rtspUrl, setRtspUrl] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const isVideoStream = selectedNode?.id?.includes('video-stream');

  // Effect to reset and initialize state when a new node is selected
  useEffect(() => {
    if (selectedNode) {
      setNodeName(selectedNode.data?.label || '');
      setIsLive(selectedNode.data?.isLive || false);
      setRtspUrl(selectedNode.data?.rtspUrl || '');
      setVideoFile(null);
      setUploadError(null);
      setUploadSuccess(null);
      setPreviewUrl(null);
      
      // Initialize from persisted file data if it exists on the node
      const persistedFileData = selectedNode.data.selectedFile;
      setSelectedFile(persistedFileData || null);
    }
  }, [selectedNode]);
  
  // Effect to update the parent node's label when it changes locally
  useEffect(() => {
    if (selectedNode && onNodeUpdate && nodeName !== selectedNode.data.label) {
        const handler = setTimeout(() => {
            onNodeUpdate(selectedNode.id, { label: nodeName });
        }, 500); // Debounce input
        return () => clearTimeout(handler);
    }
  }, [nodeName, selectedNode, onNodeUpdate]);

  // Effect to update RTSP URL
  useEffect(() => {
    if (selectedNode && onNodeUpdate && rtspUrl !== selectedNode.data.rtspUrl) {
        const handler = setTimeout(() => {
            onNodeUpdate(selectedNode.id, { rtspUrl, isLive });
        }, 500);
        return () => clearTimeout(handler);
    }
  }, [rtspUrl, isLive, selectedNode, onNodeUpdate]);

  // Effect to create a local preview URL for a newly selected file
  useEffect(() => {
    if (videoFile) {
      const url = URL.createObjectURL(videoFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [videoFile]);

  // Handler for file selection and upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedNode || !onNodeUpdate) return;

    console.log('File selected:', file.name, file.size, file.type);

    const validation = fileAPI.validateVideoFile(file);
    if (!validation.valid) {
      setUploadError(validation.error || 'Invalid file');
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);
    setVideoFile(file); // Set for local preview
    onNodeUpdate(selectedNode.id, { status: 'uploading' });

    try {
      console.log('Starting file upload...');
      const response = await fileAPI.uploadFile(file, (progress) => {
        console.log('Upload progress update:', progress);
        setUploadProgress(progress);
      });
      
      console.log('Upload response received:', response);
      
      if (response.success && response.data) {
        const uploadedFileData = response.data;
        setSelectedFile(uploadedFileData);
        setUploadSuccess(`File "${file.name}" uploaded successfully!`);
        onNodeUpdate(selectedNode.id, {
          selectedFile: uploadedFileData,
          status: 'ready'
        });
        console.log('File uploaded and associated with node:', uploadedFileData);
      } else {
        throw new Error(response.message || 'Upload failed - no data received');
      }
    } catch (error) {
      console.error('File upload error:', error);
      if (selectedNode && onNodeUpdate) {
        onNodeUpdate(selectedNode.id, { status: 'error' });
      }
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadError(errorMessage);
    } finally {
      setUploading(false);
      setUploadProgress(null);
      // Clear the input so the same file can be selected again
      e.target.value = '';
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setVideoFile(null);
    setUploadError(null);
    setUploadSuccess(null);
    setPreviewUrl(null);
    if (selectedNode && onNodeUpdate) {
      onNodeUpdate(selectedNode.id, { 
        selectedFile: undefined, 
        status: 'empty' 
      });
    }
  };

  if (collapsed) {
    return (
      <div className="w-12 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col items-center py-4">
        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="h-full bg-white dark:bg-gray-800 overflow-y-auto">
      {selectedNode && isVideoStream ? (
        <div className="p-4 space-y-6">
          {/* Node Name Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Node Name</label>
            <input
              type="text"
              value={nodeName}
              onChange={(e) => setNodeName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter node name..."
            />
          </div>

          {/* Video Source Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Video Source</h3>
            
            {/* Mode Toggle */}
            <div className="mb-4">
              <label className="flex items-center justify-between cursor-pointer p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-center space-x-3">
                  <Video className="w-5 h-5 text-red-500" />
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Use Live RTSP Stream</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Stream from cameras or live sources</p>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  checked={isLive} 
                  onChange={(e) => setIsLive(e.target.checked)} 
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors" 
                />
              </label>
            </div>

            {/* File Upload Section */}
            <div className={`transition-all duration-300 ease-in-out ${isLive ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Upload Video File</label>
                
                {/* Upload Area */}
                <div className="relative">
                  <input 
                    type="file" 
                    accept="video/*,.mp4,.mov,.avi" 
                    onChange={handleFileChange} 
                    className="hidden" 
                    id="video-upload" 
                    disabled={uploading || isLive} 
                  />
                  <label 
                    htmlFor="video-upload" 
                    className={`flex items-center justify-center w-full px-4 py-6 border-2 border-dashed rounded-lg transition-colors cursor-pointer ${
                      uploading ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/10 cursor-not-allowed' : 
                      'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 bg-gray-50 dark:bg-gray-700/50'
                    }`}
                  >
                    <div className="text-center">
                      {uploading ? (
                        <>
                          <Loader2 className="mx-auto h-8 w-8 text-blue-600 mb-2 animate-spin" />
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            Uploading... {uploadProgress?.percentage || 0}%
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {uploadProgress ? `${fileAPI.formatFileSize(uploadProgress.loaded)} / ${fileAPI.formatFileSize(uploadProgress.total)}` : 'Processing...'}
                          </p>
                        </>
                      ) : (
                        <>
                          <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Click to upload video</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">MP4, MOV, AVI up to 500MB</p>
                        </>
                      )}
                    </div>
                  </label>
                </div>

                {/* Success Message */}
                {uploadSuccess && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3 flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-700 dark:text-green-400">{uploadSuccess}</span>
                    <button onClick={() => setUploadSuccess(null)} className="ml-auto text-green-500 hover:text-green-700">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* Error Message */}
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
                      <span className={`text-xs px-2 py-1 rounded ${
                        selectedFile ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 
                        'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                      }`}>
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
            </div>

            {/* RTSP Section */}
            <div className={`transition-all duration-300 ease-in-out ${!isLive ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">RTSP Stream URL</label>
                <div className="relative">
                  <input 
                    type="url" 
                    value={rtspUrl} 
                    onChange={(e) => setRtspUrl(e.target.value)} 
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
          </div>
        </div>
      ) : selectedNode ? (
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <div>
            <Video className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Node Properties</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Selected: {selectedNode.data?.nodeType || 'Unknown'} node
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Node ID: {selectedNode.id}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <div>
            <Video className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Node Selected</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Select a node on the canvas to view its properties</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertiesPanel;
