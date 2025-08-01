import mongoose, { Schema, Document } from 'mongoose';

export interface IComment {
  _id: string;
  workflowId: string;
  objectId: string;
  author: string;
  text: string;
  position: { x: number; y: number };
  mentions: string[];
  resolved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema({
  workflowId: {
    type: Schema.Types.ObjectId,
    ref: 'Workflow',
    required: true
  },
  objectId: {
    type: String,
    required: true
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true }
  },
  mentions: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  resolved: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

commentSchema.index({ workflowId: 1 });
commentSchema.index({ objectId: 1 });
commentSchema.index({ author: 1 });

export interface CommentDocument extends Omit<IComment, '_id'>, Document {}

export default mongoose.model<CommentDocument>('Comment', commentSchema);
