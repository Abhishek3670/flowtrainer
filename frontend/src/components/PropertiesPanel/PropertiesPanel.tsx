import React, { useState, useEffect } from 'react';
import { ChevronRight, X, Upload, Video, ExternalLink, AlertCircle } from 'lucide-react';
import { Node } from 'reactflow';
import { fileAPI, FileData, UploadProgress } from '../../services/fileApi';

interface PropertiesPanelProps {
  selectedNode: Node | null;
  collapsed: boolean;
  onToggle: () => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ 
  selectedNode, 
  collapsed, 
  onToggle 
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
  
  const isVideoStream = selectedNode?.id?.includes('video-stream');

  // Effect to update node name when a new node is selected
  useEffect(() => {
    if (selectedNode) {
      setNodeName(selectedNode.data?.label || '');
      // Reset state for the new node to avoid showing old data
      setIsLive(false);
      setRtspUrl('');
      setVideoFile(null);
      setPreviewUrl(null);
      setSelectedFile(null);
      setUploadError(null);
    }
  }, [selectedNode]);

  // Effect to create a local preview URL for the selected video file
  useEffect(() => {
    if (videoFile) {
      const url = URL.createObjectURL(videoFile);
      setPreviewUrl(url);
      // Clean up the object URL when the component unmounts or the file changes
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [videoFile]);

  // Handler for file selection and upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset previous errors and set the local file for preview
    setUploadError(null);
    setVideoFile(file);

    // Validate file before uploading
    const validation = fileAPI.validateVideoFile(file);
    if (!validation.valid) {
      setUploadError(validation.error || 'Invalid file');
      return;
    }

    setUploading(true);
    try {
      const response = await fileAPI.uploadFile(file, (progress) => {
        setUploadProgress(progress);
      });

      if (response.data) {
        console.log('=== UPLOAD RESPONSE DEBUG ===');
        console.log('Full response:', response);
        console.log('File data:', response.data);
        console.log('File ID:', response.data._id);
        console.log('File ID type:', typeof response.data._id);
        setSelectedFile(response.data);
        console.log('File uploaded successfully:', response.data);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadError(errorMessage);
      console.error('File upload error:', error);
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  if (collapsed) {
    return (
      <div className="w-12 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col items-center py-4">
        <button 
          onClick={onToggle}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Panel Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Properties
          </h2>
          <button 
            onClick={onToggle}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-y-auto">
        {selectedNode && isVideoStream ? (
          <div className="p-6 space-y-8">
            {/* Node Name Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Node Name
              </label>
              <input
                type="text"
                value={nodeName}
                onChange={(e) => setNodeName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter node name..."
              />
            </div>

            {/* Video Source Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                Video Source
              </h3>
              
              {/* Mode Toggle */}
              <div className="mb-6">
                <label className="flex items-center justify-between cursor-pointer p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-center space-x-3">
                    <Video className="w-5 h-5 text-red-500" />
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Use Live RTSP Stream
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Stream from cameras or live sources
                      </p>
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

              {/* File Upload Section (shown when not in live mode) */}
              <div 
                className={`transition-all duration-300 ease-in-out ${
                  isLive 
                    ? 'opacity-0 max-h-0 overflow-hidden pointer-events-none' 
                    : 'opacity-100 max-h-[40rem]' // Adjusted max-height for content
                }`}
              >
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Upload Video File
                  </label>
                  
                  {/* Upload Area */}
                  <div className="relative">
                    <input
                      type="file"
                      accept="video/*,.mp4,.mov,.avi"
                      onChange={handleFileChange}
                      className="hidden"
                      id="video-upload"
                      disabled={uploading}
                    />
                    <label
                      htmlFor="video-upload"
                      className={`flex items-center justify-center w-full px-4 py-6 border-2 border-dashed rounded-lg transition-colors cursor-pointer ${
                        uploading 
                          ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/10 cursor-not-allowed'
                          : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 bg-gray-50 dark:bg-gray-700/50'
                      }`}
                    >
                      <div className="text-center">
                        {uploading ? (
                          <>
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              Uploading... {uploadProgress?.percentage || 0}%
                            </p>
                          </>
                        ) : (
                          <>
                            <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              Click to upload video
                            </p>
                          </>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          MP4, MOV, AVI up to 500MB
                        </p>
                      </div>
                    </label>

                    {/* Upload Progress Bar */}
                    {uploading && uploadProgress && (
                      <div className="mt-3 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${uploadProgress.percentage}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>{fileAPI.formatFileSize(uploadProgress.loaded)}</span>
                          <span>{fileAPI.formatFileSize(uploadProgress.total)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Error Message */}
                  {uploadError && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3 flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-red-700 dark:text-red-400">{uploadError}</span>
                      <button
                        onClick={() => setUploadError(null)}
                        className="ml-auto text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {/* Unified Video Preview */}
                  {(previewUrl || selectedFile) && !uploading && (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Preview
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${selectedFile ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'}`}>
                          {selectedFile ? 'Uploaded' : 'Local Preview'}
                        </span>
                      </div>
                      
                      <video
                        className="w-full rounded-lg shadow-sm"
                        controls
                        key={selectedFile ? selectedFile._id : previewUrl}
                        style={{ maxHeight: '150px' }}
                        src={selectedFile ? fileAPI.getVideoStreamUrl(selectedFile._id || selectedFile.fileId || '') : previewUrl || undefined}
                      >
                        Your browser does not support video preview.
                      </video>
                      
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate pr-2">
                          {selectedFile ? selectedFile.originalName : videoFile?.name}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                          {selectedFile 
                            ? fileAPI.formatFileSize(selectedFile.size)
                            : videoFile ? fileAPI.formatFileSize(videoFile.size) : ''
                          }
                        </span>
                      </div>

                      {/* File Actions */}
                      {selectedFile && (
                        <div className="mt-3 flex space-x-2">
                          <button
                            onClick={() => {
                              const fileId = selectedFile.fileId || selectedFile._id;
                              if (fileId) {
                                window.open(fileAPI.getVideoStreamUrl(fileId), '_blank');
                              } else {
                                alert('Error: File ID not available');
                              }
                            }}
                            className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
                          >
                            Open Full Video
                          </button>
                          <button
                            onClick={() => {
                              setSelectedFile(null);
                              setVideoFile(null);
                            }}
                            className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                          >
                            Clear
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* RTSP Section (shown when in live mode) */}
              <div 
                className={`transition-all duration-300 ease-in-out ${
                  !isLive 
                    ? 'opacity-0 max-h-0 overflow-hidden pointer-events-none' 
                    : 'opacity-100 max-h-96'
                }`}
              >
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    RTSP Stream URL
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={rtspUrl}
                      onChange={(e) => setRtspUrl(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                      placeholder="rtsp://example.com:554/stream"
                    />
                    <ExternalLink className="absolute right-3 top-3.5 w-4 h-4 text-gray-400" />
                  </div>
                  {rtspUrl && (
                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                        <span className="text-sm text-orange-700 dark:text-orange-400 font-medium">
                          RTSP Stream Configured
                        </span>
                      </div>
                      <p className="text-xs text-orange-600 dark:text-orange-500 mt-1">
                        Ready to connect to live stream
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Status Section */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Status
              </h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Current Status:</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></div>
                    Ready
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Source Type:</span>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {isLive ? 'Live Stream' : 'Video File'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Last Executed:</span>
                  <span className="text-sm text-gray-900 dark:text-white">Never</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 text-center">
            <div>
              <Video className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Node Selected
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Select a node on the canvas to view and edit its properties
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertiesPanel;