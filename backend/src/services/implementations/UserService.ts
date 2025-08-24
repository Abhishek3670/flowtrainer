import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import User, { UserDocument } from '../../models/user.model';
import { IUser } from '../../types';
import { IUserService } from '../interfaces/IUserService';

export class UserService implements IUserService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  private readonly SALT_ROUNDS = 10;

  async getUserById(id: string): Promise<UserDocument | null> {
    const user = await User.findById(id).select('-password').lean();
    return user as UserDocument | null;
  }

  async getUserByEmail(email: string): Promise<UserDocument | null> {
    return await User.findByEmail(email);
  }

  async createUser(email: string, password: string): Promise<UserDocument> {
    // Validate input
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    // Check if user exists
    const existingUser = await this.getUserByEmail(email);
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);

    // Create user
    const user = new User({
      email: email.toLowerCase(),
      password: hashedPassword
    });

    await user.save();

    // Convert to plain object and remove password
    const userObject = user.toObject();
    const { password: _, ...userWithoutPassword } = userObject;
    
    return userWithoutPassword as UserDocument;
  }

  async updateUser(id: string, data: Partial<IUser>): Promise<UserDocument | null> {
    // Don't allow password updates through this method
    if (data.password) {
      delete data.password;
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true }
    ).select('-password').lean();
    
    return updatedUser as UserDocument | null;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await User.findByIdAndDelete(id);
    return result !== null;
  }

  async validateCredentials(email: string, password: string): Promise<UserDocument | null> {
    const user = await this.getUserByEmail(email);
    if (!user || !user.password) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return null;
    }

    // Convert to plain object and remove password
    const userObject = user.toObject();
    const { password: _, ...userWithoutPassword } = userObject;
    
    return userWithoutPassword as UserDocument;
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<boolean> {
    const user = await User.findById(userId);
    if (!user || !user.password) {
      return false;
    }

    // Validate old password
    const isValid = await bcrypt.compare(oldPassword, user.password);
    if (!isValid) {
      return false;
    }

    // Validate new password
    if (newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long');
    }

    // Hash and update password
    const hashedPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS);
    user.password = hashedPassword;
    await user.save();

    return true;
  }

  async updateProfile(userId: string, profile: {
    name?: string;
    avatar?: string;
    preferences?: Record<string, any>;
  }): Promise<UserDocument | null> {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { profile } },
      { new: true }
    ).select('-password').lean();
    
    return updatedUser as UserDocument | null;
  }

  generateAuthToken(userId: Types.ObjectId): string {
    return jwt.sign(
      { userId: userId.toString() },
      this.JWT_SECRET,
      { expiresIn: '24h' }
    );
  }

  async validateAuthToken(token: string): Promise<{ userId: string; email: string } | null> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as { userId: string };
      const user = await this.getUserById(decoded.userId);
      
      if (!user) {
        return null;
      }

      return {
        userId: user._id.toString(),
        email: user.email
      };
    } catch (error) {
      return null;
    }
  }
}
