import { Types } from 'mongoose';
import { IUser } from '../../types';
import { UserDocument } from '../../models/user.model';

export interface IUserService {
  // Core user operations
  getUserById(id: string): Promise<UserDocument | null>;
  getUserByEmail(email: string): Promise<UserDocument | null>;
  createUser(email: string, password: string): Promise<UserDocument>;
  updateUser(id: string, data: Partial<IUser>): Promise<UserDocument | null>;
  deleteUser(id: string): Promise<boolean>;
  
  // Authentication
  validateCredentials(email: string, password: string): Promise<UserDocument | null>;
  changePassword(userId: string, oldPassword: string, newPassword: string): Promise<boolean>;
  
  // Profile management
  updateProfile(userId: string, profile: {
    name?: string;
    avatar?: string;
    preferences?: Record<string, any>;
  }): Promise<UserDocument | null>;
  
  // Session management
  generateAuthToken(userId: Types.ObjectId): string;
  validateAuthToken(token: string): Promise<{ userId: string; email: string } | null>;
}
