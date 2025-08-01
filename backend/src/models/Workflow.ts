import mongoose, { Schema, Document } from 'mongoose';
import { IWorkflow, INode, IEdge, NodeType } from '../types';

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

const workflowSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  nodes: [nodeSchema],
  edges: [edgeSchema],
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  collaborators: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

workflowSchema.index({ ownerId: 1 });
workflowSchema.index({ collaborators: 1 });
workflowSchema.index({ isPublic: 1 });
workflowSchema.index({ title: 'text', description: 'text' });

export interface WorkflowDocument extends Omit<IWorkflow, '_id'>, Document {}

export default mongoose.model<WorkflowDocument>('Workflow', workflowSchema);
