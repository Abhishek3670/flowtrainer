import mongoose, { Schema, Document } from 'mongoose';

export interface WorkflowRevisionDocument extends Document {
  workflowId: mongoose.Types.ObjectId;
  version: number;
  nodes: any[];
  edges: any[];
  createdBy: mongoose.Types.ObjectId;
  changeDescription: string;
  createdAt: Date;
  updatedAt: Date;
}

const workflowRevisionSchema = new Schema({
  workflowId: { type: Schema.Types.ObjectId, ref: 'Workflow', required: true },
  version: { type: Number, required: true },
  nodes: [Schema.Types.Mixed],
  edges: [Schema.Types.Mixed],
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  changeDescription: { type: String, required: true }
}, {
  timestamps: true
});

workflowRevisionSchema.index({ workflowId: 1, version: -1 });
workflowRevisionSchema.index({ createdBy: 1 });

export default mongoose.model<WorkflowRevisionDocument>('WorkflowRevision', workflowRevisionSchema);
