// backend/src/models/ModelConfig.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IModelConfig extends Document {
  name: string;
  type: string;
  version?: string;
  status: 'active' | 'inactive' | 'training' | 'failed';
  accuracy?: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const ModelConfigSchema = new Schema<IModelConfig>({
  name: { type: String, required: true, index: true },
  type: { type: String, required: true },
  version: { type: String },
  status: { type: String, enum: ['active', 'inactive', 'training', 'failed'], default: 'inactive' },
  accuracy: { type: Number },
  metadata: { type: Schema.Types.Mixed }
}, { timestamps: true });

ModelConfigSchema.index({ name: 'text', type: 'text' });

export const ModelConfig: Model<IModelConfig> = mongoose.models.ModelConfig || mongoose.model<IModelConfig>('ModelConfig', ModelConfigSchema);