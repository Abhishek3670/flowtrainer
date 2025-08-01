import mongoose, { Schema, Document } from 'mongoose';
import { IWorkflowRevision, INode, IEdge, NodeType } from '../types';

const nodeSchema = new Schema({
  id: { type: String, required: true },
  type: { type: String, enum: Object.values(NodeType), required: true },
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true }
  },
  data: { type: Schema.Types.Mixed, default: {} },
  selected: { type: Boolean, default: false }
}, { _id: false });

const edgeSchema = new Schema({
  id: { type: String, required: true },
  source: { type: String, required: true },
  target: { type: String, required: true },
  sourceHandle: { type: String },
  targetHandle: { type: String },
  type: { type: String },
  animated: { type: Boolean, default: false },
  style: { type: Schema.Types.Mixed }
}, { _id: false });

const workflowRevisionSchema = new Schema({
  workflowId: {
    type: Schema.Types.ObjectId,
    ref: 'Workflow',
    required: true
  },
  version: {
    type: Number,
    required: true
  },
  nodes: [nodeSchema],
  edges: [edgeSchema],
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  changeDescription: {
    type: String,
    trim: true,
    maxlength: 200
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

workflowRevisionSchema.index({ workflowId: 1, version: -1 });
workflowRevisionSchema.index({ createdBy: 1 });

export interface WorkflowRevisionDocument extends IWorkflowRevision, Document {}

export default mongoose.model<WorkflowRevisionDocument>('WorkflowRevision', workflowRevisionSchema);
