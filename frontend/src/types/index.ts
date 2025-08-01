export interface User {
  id: string;
  email: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface Workflow {
  _id: string;
  title: string;
  description?: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  ownerId: string;
  collaborators: string[];
  isPublic: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface FlowNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: Record<string, any>;
  selected?: boolean;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: string;
  animated?: boolean;
  style?: Record<string, any>;
}

export enum NodeType {
  START = 'start',
  HTTP = 'http',
  DELAY = 'delay',
  CONDITION = 'condition',
  LOOP = 'loop',
  END = 'end'
}

// New whiteboard object types
export enum WhiteboardObjectType {
  // Legacy workflow nodes
  START = 'start',
  HTTP = 'http',
  DELAY = 'delay',
  CONDITION = 'condition',
  LOOP = 'loop',
  END = 'end',
  
  // New whiteboard objects
  STICKY_NOTE = 'sticky_note',
  TEXT = 'text',
  RECTANGLE = 'rectangle',
  CIRCLE = 'circle',
  TRIANGLE = 'triangle',
  LINE = 'line',
  ARROW = 'arrow',
  IMAGE = 'image',
  DRAWING = 'drawing',
  FRAME = 'frame',
  
  // Data pipeline blocks
  DATA_PIPELINE = 'data_pipeline'
}

export interface WorkflowState {
  currentWorkflow: Workflow | null;
  workflows: Workflow[];
  nodes: FlowNode[];
  edges: FlowEdge[];
  selectedNode: FlowNode | null;
  loading: boolean;
  error: string | null;
  undoStack: { nodes: FlowNode[]; edges: FlowEdge[] }[];
  redoStack: { nodes: FlowNode[]; edges: FlowEdge[] }[];
}

export interface UIState {
  isDarkMode: boolean;
  sidebarCollapsed: boolean;
  selectedNodeId: string | null;
  propertiesPanelOpen: boolean;
}

export interface WorkflowUpdate {
  type: 'node_added' | 'node_updated' | 'node_removed' | 'edge_added' | 'edge_updated' | 'edge_removed' | 'workflow_updated';
  payload: any;
  workflowId: string;
  userId: string;
  timestamp: Date;
}

export interface UserCursor {
  userId: string;
  email: string;
  position: { x: number; y: number };
  workflowId: string;
}

export interface NodeConfig {
  type: NodeType;
  label: string;
  icon: string;
  color: string;
  defaultData: Record<string, any>;
}

// New whiteboard object interfaces
export interface WhiteboardObject {
  id: string;
  type: WhiteboardObjectType;
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation?: number;
  zIndex?: number;
  selected?: boolean;
  locked?: boolean;
  data: Record<string, any>;
  style?: {
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    opacity?: number;
    [key: string]: any;
  };
}

// Specific object types
export interface StickyNote extends WhiteboardObject {
  type: WhiteboardObjectType.STICKY_NOTE;
  data: {
    text: string;
    color: string;
    fontSize?: number;
  };
}

export interface TextObject extends WhiteboardObject {
  type: WhiteboardObjectType.TEXT;
  data: {
    text: string;
    fontSize: number;
    fontFamily?: string;
    fontWeight?: string;
    textAlign?: 'left' | 'center' | 'right';
    color?: string;
  };
}

export interface ShapeObject extends WhiteboardObject {
  type: WhiteboardObjectType.RECTANGLE | WhiteboardObjectType.CIRCLE | WhiteboardObjectType.TRIANGLE;
  data: {
    fillColor?: string;
    strokeColor?: string;
    strokeWidth?: number;
  };
}

export interface ImageObject extends WhiteboardObject {
  type: WhiteboardObjectType.IMAGE;
  data: {
    src: string;
    alt?: string;
    originalWidth: number;
    originalHeight: number;
  };
}

export interface DrawingObject extends WhiteboardObject {
  type: WhiteboardObjectType.DRAWING;
  data: {
    paths: Array<{
      points: Array<{ x: number; y: number }>;
      color: string;
      width: number;
    }>;
  };
}

// Data pipeline process steps
export enum ProcessStep {
  SOURCE = 'source',
  EXTRACTION = 'extraction',
  OUTPUT = 'output'
}

export interface ProcessStepConfig {
  id: ProcessStep;
  label: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  config?: Record<string, any>;
  progress?: number;
}

// Data pipeline block interface
export interface DataPipelineBlock extends WhiteboardObject {
  type: WhiteboardObjectType.DATA_PIPELINE;
  data: {
    title: string;
    description?: string;
    steps: ProcessStepConfig[];
    isRunning: boolean;
    currentStep?: ProcessStep;
    results?: Record<string, any>;
    config?: {
      source?: {
        type: 'file' | 'database' | 'api';
        path?: string;
        connection?: Record<string, any>;
      };
      extraction?: {
        method: 'sampling' | 'filtering' | 'transformation';
        parameters?: Record<string, any>;
      };
      output?: {
        format: 'json' | 'csv' | 'database';
        destination?: string;
      };
    };
  };
}

// Canvas state
export interface CanvasState {
  zoom: number;
  pan: { x: number; y: number };
  tool: string;
  objects: WhiteboardObject[];
  selectedObjectIds: string[];
  clipboard: WhiteboardObject[];
}

// Updated workflow state to include canvas
export interface WhiteboardState extends Omit<WorkflowState, 'nodes' | 'edges' | 'undoStack' | 'redoStack'> {
  canvas: CanvasState;
  comments: Comment[];
  templates: Template[];
  undoStack: { canvas: CanvasState }[];
  redoStack: { canvas: CanvasState }[];
}

export interface Comment {
  id: string;
  objectId: string;
  author: User;
  text: string;
  position: { x: number; y: number };
  createdAt: string;
  resolved?: boolean;
  mentions?: string[];
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  objects: WhiteboardObject[];
  category: string;
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
}
