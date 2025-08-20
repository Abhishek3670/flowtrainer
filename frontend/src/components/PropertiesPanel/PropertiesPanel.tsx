// frontend/src/components/PropertiesPanel/PropertiesPanel.tsx

import React, { useState, useEffect } from 'react';
import { ChevronRight, Video } from 'lucide-react';
import { Node } from 'reactflow';
import { NodeData, FileData, UploadProgress } from '../../types';
import { fileAPI } from '../../services/fileApi';
import { NodeConfiguratorFactory } from './NodeConfigurators/factory';

interface PropertiesPanelProps {
  selectedNode: Node<NodeData> | null;
  collapsed?: boolean;
  onNodeUpdate: (nodeId: string, newData: Partial<NodeData>) => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedNode,
  collapsed = false,
  onNodeUpdate,
}) => {


  if (collapsed) {
    return <div className="p-4 text-gray-500">Properties collapsed</div>;
  }
  if (!selectedNode) {
    return <div className="p-4 text-gray-500">No node selected</div>;
  }

  // For non-video-stream nodes, use the new configurator
  const isVideoStream = selectedNode.data.nodeType === 'video-stream';
  if (!isVideoStream) {
    const nodeTypeRaw = selectedNode.data.nodeType || selectedNode.id;
    const nodeType = nodeTypeRaw.replace(/-\d+$/, '');

    const Configurator = NodeConfiguratorFactory.getConfigurator(nodeType);

    return (
      <div className="p-4 overflow-y-auto">
        <Configurator node={selectedNode} onNodeUpdate={onNodeUpdate} />
      </div>
    );
  }

  // Otherwise, render the existing video-stream properties panel
  // --- Begin existing video-stream logic unchanged ---
  const [nodeName, setNodeName] = useState(selectedNode.data.label);
  const [isLive, setIsLive] = useState(!!selectedNode.data.isLive);
  const [rtspUrl, setRtspUrl] = useState(selectedNode.data.rtspUrl || '');
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileData | null>(selectedNode.data.selectedFile || null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    setNodeName(selectedNode.data.label);
    setIsLive(!!selectedNode.data.isLive);
    setRtspUrl(selectedNode.data.rtspUrl || '');
    setSelectedFile(selectedNode.data.selectedFile || null);
    setUploadError(null);
    setUploadSuccess(null);
    setVideoFile(null);
    setPreviewUrl(null);
    setUploadProgress(null);
  }, [selectedNode]);

  useEffect(() => {
    const handler = setTimeout(() => {
      onNodeUpdate(selectedNode.id, { label: nodeName });
    }, 500);
    return () => clearTimeout(handler);
  }, [nodeName]);

  useEffect(() => {
    const handler = setTimeout(() => {
      onNodeUpdate(selectedNode.id, { isLive, rtspUrl });
    }, 500);
    return () => clearTimeout(handler);
  }, [isLive, rtspUrl]);

  useEffect(() => {
    if (!videoFile) return;
    const url = URL.createObjectURL(videoFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [videoFile]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    onNodeUpdate(selectedNode.id, { status: 'uploading' });
    try {
      const resp = await fileAPI.uploadFile(file, setUploadProgress);
      const data = resp.data!;
      setSelectedFile(data);
      onNodeUpdate(selectedNode.id, { selectedFile: data, status: 'ready' });
      setUploadSuccess(`Uploaded "${file.name}"`);
    } catch (err: any) {
      onNodeUpdate(selectedNode.id, { status: 'error' });
      setUploadError(err.message);
    } finally {
      setUploading(false);
      setUploadProgress(null);
      e.target.value = '';
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    onNodeUpdate(selectedNode.id, { selectedFile: undefined, status: 'empty' });
  };

  return (
    <div className="p-4 space-y-6 overflow-y-auto">
      {/* Node Name */}
      <div>
        <label className="block text-sm font-medium mb-1">Node Name</label>
        <input
          type="text"
          className="w-full px-3 py-2 border rounded-md"
          value={nodeName}
          onChange={e => setNodeName(e.target.value)}
        />
      </div>

      {/* Live Toggle */}
      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={isLive}
            onChange={e => setIsLive(e.target.checked)}
          />
          <span>Use Live RTSP Stream</span>
        </label>
      </div>

      {/* File Upload or RTSP */}
      {!isLive ? (
        <div>
          <label className="block text-sm font-medium mb-1">Upload Video File</label>
          <input
            type="file"
            accept=".mp4,.mov,.avi"
            disabled={uploading}
            onChange={handleFileChange}
            className="block w-full"
          />
          {uploading && <p>Uploading {uploadProgress?.percentage}%</p>}
          {uploadError && <p className="text-red-600">{uploadError}</p>}
          {uploadSuccess && <p className="text-green-600">{uploadSuccess}</p>}
          {selectedFile && (
            <>
              <video
                controls
                src={fileAPI.getVideoStreamUrl(selectedFile.fileId)}
                className="w-full mt-2"
              />
              <button onClick={clearFile} className="mt-2 text-red-600">
                Remove
              </button>
            </>
          )}
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium mb-1">RTSP URL</label>
          <input
            type="url"
            className="w-full px-3 py-2 border rounded-md"
            value={rtspUrl}
            onChange={e => setRtspUrl(e.target.value)}
          />
        </div>
      )}
    </div>
  );
};

export default PropertiesPanel;
