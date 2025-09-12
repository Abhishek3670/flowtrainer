// backend/src/models/User.ts
// Minimal User model typings and mongoose schema to satisfy imports without changing behavior elsewhere
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password?: string;
  role: string;
  roles?: string[];
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true },
  password: { type: String },
  role: { type: String, default: 'user' },
  roles: [{ type: String }]
});

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);