// backend/src/models/DbConnection.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDbConnection extends Document {
  name: string;
  type: 'mongodb' | 'postgresql' | 'mysql' | 'redis';
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  options?: Record<string, any>;
  status: 'connected' | 'disconnected' | 'error';
  lastChecked?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DbConnectionSchema = new Schema<IDbConnection>({
  name: { type: String, required: true, index: true },
  type: { type: String, enum: ['mongodb', 'postgresql', 'mysql', 'redis'], required: true },
  host: { type: String },
  port: { type: Number },
  username: { type: String },
  password: { type: String },
  database: { type: String },
  options: { type: Schema.Types.Mixed },
  status: { type: String, enum: ['connected', 'disconnected', 'error'], default: 'disconnected' },
  lastChecked: { type: Date }
}, { timestamps: true });

DbConnectionSchema.index({ name: 'text', host: 'text', database: 'text' });

export const DbConnection: Model<IDbConnection> = mongoose.models.DbConnection || mongoose.model<IDbConnection>('DbConnection', DbConnectionSchema);