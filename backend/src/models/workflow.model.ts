import mongoose, { Schema, Document, Types } from 'mongoose';
import { IWorkflowBase } from '../types';

// Extend the base workflow interface and mongoose Document
export interface WorkflowDocument extends IWorkflowBase, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const workflowSchema = new Schema({
  title: { type: String, required: true },
  description: String,
  nodes: [Schema.Types.Mixed],
  edges: [Schema.Types.Mixed],
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  collaborators: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  isPublic: { type: Boolean, default: false },
  version: { type: Number, default: 1 }
}, {
  timestamps: true
});

workflowSchema.index({ ownerId: 1 });
workflowSchema.index({ collaborators: 1 });
workflowSchema.index({ title: 'text', description: 'text' });

export default mongoose.model<WorkflowDocument>('Workflow', workflowSchema);
