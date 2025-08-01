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
