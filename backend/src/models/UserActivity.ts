import mongoose, { Document, Schema } from 'mongoose';

export interface IUserActivity extends Document {
  userId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  status: 'success' | 'failed' | 'pending';
  timestamp: Date;
}

const UserActivitySchema: Schema = new Schema({
  userId: { 
    type: String, 
    required: true, 
    index: true 
  },
  action: { 
    type: String, 
    required: true, 
    index: true 
  },
  entityType: { 
    type: String, 
    index: true 
  },
  entityId: { 
    type: String, 
    index: true 
  },
  ipAddress: String,
  userAgent: String,
  metadata: Schema.Types.Mixed,
  status: {
    type: String,
    enum: ['success', 'failed', 'pending'],
    default: 'success'
  },
  timestamp: { 
    type: Date, 
    default: Date.now, 
    index: true 
  }
});

// Add indexes
UserActivitySchema.index({ userId: 1, timestamp: -1 });
UserActivitySchema.index({ action: 1, timestamp: -1 });
UserActivitySchema.index({ entityType: 1, entityId: 1 });
UserActivitySchema.index({ timestamp: -1 }); // For TTL index, but we'll handle that in the migration

export default mongoose.model<IUserActivity>('UserActivity', UserActivitySchema);