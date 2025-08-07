import mongoose, { Schema, Document } from "mongoose";

const NodeSchema = new Schema({
  id: String,
  type: String,
  position: { x: Number, y: Number },
  data: Schema.Types.Mixed,
});

const EdgeSchema = new Schema({
  id: String,
  source: String,
  target: String,
  label: String,
  style: Schema.Types.Mixed,
});

export interface IWorkflow extends Document {
  name: string;
  nodes: typeof NodeSchema[];
  edges: typeof EdgeSchema[];
  createdBy: string;
}

const WorkflowSchema = new Schema<IWorkflow>({
  name: { type: String, required: true },
  nodes: [NodeSchema],
  edges: [EdgeSchema],
  createdBy: { type: String, required: true },
});

export default mongoose.model<IWorkflow>("Workflow", WorkflowSchema);
