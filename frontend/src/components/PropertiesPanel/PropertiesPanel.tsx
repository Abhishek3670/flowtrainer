import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, X, Upload, Video, ExternalLink, AlertCircle } from 'lucide-react';
import { Node } from 'reactflow';

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

const fileAPI = {
  validateVideoFile: (file: File): { valid: boolean; error?: string } => {
    if (file.size > 500 * 1024 * 1024) {
      return { valid: false, error: 'File exceeds 500MB limit.' };
    }
    return { valid: true };
  },
  uploadFile: async (
    file: File,
    onProgress: (progress: UploadProgress) => void,
    signal: AbortSignal
  ): Promise<{ data: FileData }> => {
    for (let p = 0; p <= 100; p += 10) {
      if (signal.aborted) throw new DOMException('Upload aborted', 'AbortError');
      await new Promise(res => setTimeout(res, 50));
      onProgress({ loaded: (file.size * p) / 100, total: file.size, percentage: p });
    }
    const fileId = `file-${Date.now()}`;
    return {
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
  },
  getVideoStreamUrl: (fileId: string) =>
    `http://localhost:4000/api/files/stream/${fileId}`,
  formatFileSize: (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },
};

interface PropertiesPanelProps {
  selectedNode: Node<NodeData> | null;
  collapsed: boolean;
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
  onNodeUpdate: (nodeId: string, newData: Partial<NodeData>) => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedNode,
  collapsed,
  isOpen,
  onClose,
  onToggle,
  onNodeUpdate,
}) => {
  const [label, setLabel] = useState('');
  const [isLive, setIsLive] = useState(false);
  const [rtspUrl, setRtspUrl] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  const isVideoStream = selectedNode?.id?.includes('video-stream');

  useEffect(() => {
    if (selectedNode) {
      setLabel(selectedNode.data?.label || '');
      setIsLive(false);
      setRtspUrl('');
      setVideoFile(null);
      setUploadError(null);
      setPreviewUrl(null);
      setSelectedFile(selectedNode.data.selectedFile || null);
    }
  }, [selectedNode]);

  useEffect(() => {
    if (selectedNode && onNodeUpdate && label !== selectedNode.data.label) {
      const handler = setTimeout(() => {
        onNodeUpdate(selectedNode.id, { label });
      }, 500);
      return () => clearTimeout(handler);
    }
  }, [label, selectedNode, onNodeUpdate]);

  useEffect(() => {
    if (videoFile) {
      const url = URL.createObjectURL(videoFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [videoFile]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowVideoModal(false);
    };
    if (showVideoModal) {
      window.addEventListener('keydown', handleKey);
      return () => window.removeEventListener('keydown', handleKey);
    }
  }, [showVideoModal]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedNode) return;

    const validation = fileAPI.validateVideoFile(file);
    if (!validation.valid) {
      setUploadError(validation.error || 'Invalid file');
      return;
    }

    setUploading(true);
    setUploadError(null);
    setVideoFile(file);
    onNodeUpdate(selectedNode.id, { status: 'uploading' });

    abortRef.current = new AbortController();

    try {
      const response = await fileAPI.uploadFile(
        file,
        setUploadProgress,
        abortRef.current.signal
      );

      if (response.data) {
        setSelectedFile(response.data);
        onNodeUpdate(selectedNode.id, {
          selectedFile: response.data,
          status: 'ready',
        });
      }
    } catch (error) {
      if (selectedNode) {
        onNodeUpdate(selectedNode.id, { status: 'error' });
      }
      if ((error as any).name === 'AbortError') {
        setUploadError('Upload cancelled.');
      } else {
        setUploadError(
          error instanceof Error ? error.message : 'Upload failed'
        );
      }
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const cancelUpload = () => {
    abortRef.current?.abort();
    setUploading(false);
    setUploadProgress(null);
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
    <div
      className={`fixed top-16 right-0 h-[calc(100%-4rem)] w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 transform transition-transform duration-300 z-40 flex flex-col ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Properties
        </h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {selectedNode && isVideoStream ? (
          <>
            {/* Node Name */}
            <label className="block text-sm font-medium mb-2">Node Name</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700"
              placeholder="Enter node name..."
            />

            {/* Live / File Mode */}
            <div className="mt-6">
              <label className="flex items-center justify-between p-3 border rounded-lg">
                <span className="flex items-center space-x-2">
                  <Video className="w-5 h-5 text-red-500" />
                  <span>Use Live RTSP Stream</span>
                </span>
                <input
                  type="checkbox"
                  checked={isLive}
                  onChange={(e) => setIsLive(e.target.checked)}
                />
              </label>
            </div>

            {/* File Upload */}
            {!isLive && (
              <div className="mt-4">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="video-upload"
                />
                <label
                  htmlFor="video-upload"
                  className="flex flex-col items-center border-2 border-dashed p-4 rounded-lg cursor-pointer"
                >
                  {uploading ? (
                    <>
                      <div className="spinner mb-2" />
                      Uploading {uploadProgress?.percentage || 0}%
                      <button
                        onClick={cancelUpload}
                        className="mt-2 px-2 py-1 bg-red-500 text-white rounded"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 mb-1" />
                      Click to upload video
                    </>
                  )}
                </label>
                {uploadError && (
                  <div className="mt-2 text-red-500 flex items-center text-sm">
                    <AlertCircle className="w-4 h-4 mr-1" /> {uploadError}
                  </div>
                )}
              </div>
            )}

            {/* RTSP URL */}
            {isLive && (
              <div className="mt-4">
                <label>RTSP Stream URL</label>
                <input
                  type="url"
                  value={rtspUrl}
                  onChange={(e) => setRtspUrl(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700"
                  placeholder="rtsp://example.com:554/stream"
                />
              </div>
            )}
          </>
        ) : (
          <div className="flex justify-center items-center h-full text-gray-500">
            No Node Selected
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertiesPanel;
