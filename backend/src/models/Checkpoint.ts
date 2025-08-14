import { Schema, model, Document } from 'mongoose';

// Define Node and Edge types locally instead of importing from reactflow
export interface ReactFlowNode {
  id: string;
  type?: string;
  position: { x: number; y: number };
  data: any;
  selected?: boolean;
  dragging?: boolean;
  width?: number;
  height?: number;
}

export interface ReactFlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: string;
  animated?: boolean;
  selected?: boolean;
  data?: any;
}

export interface Checkpoint extends Document {
  workflowId: string;
  name: string;
  description?: string;
  createdAt: Date;
  createdBy: string;
  nodes: ReactFlowNode[];
  edges: ReactFlowEdge[];
  viewport: { x: number; y: number; zoom: number };
  metadata?: {
    nodeCount: number;
    edgeCount: number;
    tags?: string[];
  };
}

const CheckpointSchema = new Schema<Checkpoint>({
  workflowId: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: String, required: true },
  nodes: { type: Schema.Types.Mixed, default: [] },
  edges: { type: Schema.Types.Mixed, default: [] },
  viewport: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    zoom: { type: Number, required: true }
  },
  metadata: {
    nodeCount: Number,
    edgeCount: Number,
    tags: [String],
  }
});

export const CheckpointModel = model<Checkpoint>('Checkpoint', CheckpointSchema);
