export interface IUser {
  _id: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWorkflow {
  _id: string;
  title: string;
  description?: string;
  nodes: INode[];
  edges: IEdge[];
  ownerId: string;
  collaborators: string[];
  isPublic: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface INode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: Record<string, any>;
  selected?: boolean;
}

export interface IEdge {
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

export interface IWorkflowRevision {
  _id: string;
  workflowId: string;
  version: number;
  nodes: INode[];
  edges: IEdge[];
  createdBy: string;
  createdAt: Date;
  changeDescription?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export interface SocketData {
  userId: string;
  email: string;
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
