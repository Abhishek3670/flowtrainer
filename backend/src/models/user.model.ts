import mongoose, { Schema, Model, Document, Types } from 'mongoose';
import { IUserBase } from '../types';

export interface UserDocument extends IUserBase, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  
  // Additional methods can be added here
  // For example: comparePassword(candidatePassword: string): Promise<boolean>;
}

interface UserModel extends Model<UserDocument> {
  findByEmail(email: string): Promise<UserDocument | null>;
}

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  profile: {
    name: String,
    avatar: String,
    preferences: Schema.Types.Mixed
  }
}, {
  timestamps: true
});

userSchema.index({ email: 1 });

// Add static methods
userSchema.statics.findByEmail = function(email: string): Promise<UserDocument | null> {
  return this.findOne({ email: email.toLowerCase() });
};

export default mongoose.model<UserDocument, UserModel>('User', userSchema);
