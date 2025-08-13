import { Node as ReactFlowNode, Edge as ReactFlowEdge } from 'reactflow';

// File-related types
export interface FileData {
  _id: string;
  fileId: string;  // This will be same as _id from backend
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  duration?: number;
  resolution?: {
    width: number;
    height: number;
  };
  status: 'uploading' | 'processing' | 'ready' | 'error';
  uploadedAt: string;
  path?: string;
  thumbnailPath?: string;
}

// Node data interface
export interface NodeData {
  hasError?: boolean;
  label: string;
  nodeName?: string;
  nodeType?: string;
  isLive?: boolean;
  rtspUrl?: string;
  selectedFile?: FileData;
  status?: 'empty' | 'uploading' | 'ready' | 'error' | 'configuring';
  onDelete: (nodeId: string) => void;
  [key: string]: any;
}

// Validation error interface
export interface ValidationError {
  nodeId: string;
  message: string;
  severity?: 'error' | 'warning' | 'info';
}

// Workflow-related types
export interface WorkflowData {
  _id?: string;
  name: string;
  description?: string;
  nodes: ReactFlowNode<NodeData>[];
  edges: ReactFlowEdge[];
  viewport?: { x: number; y: number; zoom: number };
  category?: 'ml-training' | 'data-processing' | 'computer-vision' | 'other';
  status?: 'draft' | 'published' | 'archived';
  tags?: string[];
  lastModified?: string;
  updatedAt?: string;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface ExecutionResponse {
  executionId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
}

// Upload progress interface
export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// File API response
export interface FileApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
