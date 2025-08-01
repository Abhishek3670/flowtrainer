import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from '../types';

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
  }
}, {
  timestamps: true
});

userSchema.index({ email: 1 });

export interface UserDocument extends Omit<IUser, '_id'>, Document {}

export default mongoose.model<UserDocument>('User', userSchema);
