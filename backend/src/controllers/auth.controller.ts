import { Request, Response } from 'express';
import { generateTokens, verifyRefreshToken } from '../utils/jwt';
import { User } from '../models/User';
import bcrypt from 'bcrypt';
import logger from '../utils/logger';
import crypto from 'crypto';
import { sendPasswordResetEmail, sendWelcomeEmail } from '../utils/email';

export class AuthController {
  /**
   * Register a new user
   */
  static async register(req: Request, res: Response) {
    try {
      const { email, password, firstName, lastName } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          error: {
            code: 'user_exists',
            message: 'User with this email already exists',
          },
        });
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create new user
      const user = new User({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: 'user', 
        permissions: [], 
      });

      await user.save();

      // Send welcome email
      try {
        await sendWelcomeEmail(user.email, user.firstName);
      } catch (emailError) {
        logger.error('Failed to send welcome email:', emailError);
      }

      // Generate tokens
      const tokens = generateTokens({
        id: user._id.toString(),
        role: user.role,
        permissions: user.permissions,
      });

      // Set refresh token as HTTP-only cookie
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Return user data (without password) and access token
      const { password: _, ...userData } = user.toObject();
      
      return res.status(201).json({
        user: userData,
        accessToken: tokens.accessToken,
      });
    } catch (error) {
      logger.error('Registration error:', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        email: req.body.email
      });
      return res.status(500).json({
        error: {
          code: 'registration_failed',
          message: 'Failed to register user',
        },
      });
    }
  }

  /**
   * Handle user login
   */
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      // Find user by email and explicitly select the password field
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        return res.status(401).json({
          error: {
            code: 'invalid_credentials',
            message: 'Invalid email or password',
          },
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          error: {
            code: 'invalid_credentials',
            message: 'Invalid email or password',
          },
        });
      }

      // Update last login timestamp
      user.lastLogin = new Date();
      await user.save();

      // Check if user needs to reset password
      if (user.needsPasswordReset) {
        return res.status(403).json({
          error: {
            code: 'password_reset_required',
            message: 'Password reset required',
            needsPasswordReset: true
          },
        });
      }

      // Generate tokens
      const tokens = generateTokens({
        id: user._id.toString(),
        role: user.role,
        permissions: user.permissions,
      });

      // Set refresh token as HTTP-only cookie
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Return access token and user data with role information
      return res.json({
        accessToken: tokens.accessToken,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          permissions: user.permissions,
          lastLogin: user.lastLogin,
        },
      });
    } catch (error) {
      logger.error('Login error:', error);
      return res.status(500).json({
        error: {
          code: 'internal_server_error',
          message: 'An error occurred during login',
        },
      });
    }
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.cookies;

      if (!refreshToken) {
        return res.status(401).json({
          error: {
            code: 'missing_refresh_token',
            message: 'Refresh token is required',
          },
        });
      }

      // Verify refresh token
      const payload = verifyRefreshToken(refreshToken);

      // In a real app, you would verify the refresh token against the database
      // and check if it's been revoked
      const user = await User.findById(payload.sub);
      if (!user) {
        return res.status(401).json({
          error: {
            code: 'invalid_token',
            message: 'User not found',
          },
        });
      }

      // Generate new tokens
      const tokens = generateTokens({
        id: user._id.toString(),
        role: user.role,
        permissions: user.permissions,
      });

      // Set new refresh token as HTTP-only cookie
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return res.json({
        accessToken: tokens.accessToken,
      });
    } catch (error) {
      logger.error('Refresh token error:', error);
      return res.status(401).json({
        error: {
          code: 'invalid_token',
          message: 'Invalid or expired refresh token',
        },
      });
    }
  }

  /**
   * Logout user by clearing the refresh token cookie
   */
  static async logout(_req: Request, res: Response) {
    try {
      // Clear the refresh token cookie
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });

      return res.status(204).send();
    } catch (error) {
      logger.error('Logout error:', error);
      return res.status(500).json({
        error: {
          code: 'internal_server_error',
          message: 'An error occurred during logout',
        },
      });
    }
  }

  /**
   * Get current user information
   */
  static async getCurrentUser(req: Request, res: Response) {
    try {
      // The user object is attached to the request by the authenticate middleware
      const user = (req as any).user;

      if (!user) {
        return res.status(401).json({
          error: {
            code: 'unauthorized',
            message: 'Not authenticated',
          },
        });
      }

      // Get fresh user data from the database
      const userData = await User.findById(user.id).select('-password');

      if (!userData) {
        return res.status(404).json({
          error: {
            code: 'user_not_found',
            message: 'User not found',
          },
        });
      }

      return res.json({
        id: userData._id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        permissions: userData.permissions,
        lastLogin: userData.lastLogin,
      });
    } catch (error) {
      logger.error('Get current user error:', error);
      return res.status(500).json({
        error: {
          code: 'internal_server_error',
          message: 'An error occurred while fetching user data',
        },
      });
    }
  }

  /**
   * Initiate password reset process
   */
  static async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;

      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        // For security reasons, we don't reveal if the email exists
        return res.status(200).json({
          message: 'If the email exists in our system, a password reset link has been sent',
        });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

      // Save reset token and expiry to user
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = resetTokenExpiry;
      await user.save();

      // Send reset email
      try {
        await sendPasswordResetEmail(user.email, user.firstName, resetToken);
        logger.info('Password reset email sent', { email: user.email });
      } catch (emailError) {
        logger.error('Failed to send password reset email:', emailError);
        return res.status(500).json({
          error: {
            code: 'email_send_failed',
            message: 'Failed to send password reset email',
          },
        });
      }

      return res.status(200).json({
        message: 'If the email exists in our system, a password reset link has been sent',
      });
    } catch (error) {
      logger.error('Forgot password error:', error);
      return res.status(500).json({
        error: {
          code: 'internal_server_error',
          message: 'An error occurred while processing your request',
        },
      });
    }
  }

  /**
   * Reset user password with token
   */
  static async resetPassword(req: Request, res: Response) {
    try {
      const { token, newPassword } = req.body;

      // Find user by reset token and check if it's not expired
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() },
      });

      if (!user) {
        return res.status(400).json({
          error: {
            code: 'invalid_token',
            message: 'Password reset token is invalid or has expired',
          },
        });
      }

      // Update user password and clear reset token
      // The pre-save hook will automatically hash the password
      user.password = newPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      user.needsPasswordReset = false;
      await user.save();

      logger.info('Password reset successful', { userId: user._id });

      return res.status(200).json({
        message: 'Password has been reset successfully',
      });
    } catch (error) {
      logger.error('Reset password error:', error);
      return res.status(500).json({
        error: {
          code: 'internal_server_error',
          message: 'An error occurred while resetting your password',
        },
      });
    }
  }

  /**
   * Reset user password with current password (for first-time users)
   */
  static async resetPasswordWithCurrent(req: Request, res: Response) {
    try {
      const { email, currentPassword, newPassword } = req.body;

      // Find user by email and explicitly select the password field
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        return res.status(401).json({
          error: {
            code: 'invalid_credentials',
            message: 'Invalid email or password',
          },
        });
      }

      // Verify current password
      const isPasswordValid = await user.comparePassword(currentPassword);
      if (!isPasswordValid) {
        return res.status(401).json({
          error: {
            code: 'invalid_password',
            message: 'Current password is incorrect',
          },
        });
      }

      // Update user password and clear needsPasswordReset flag
      // The pre-save hook will automatically hash the password
      user.password = newPassword;
      user.needsPasswordReset = false;
      await user.save();

      logger.info('Password reset with current password successful', { userId: user._id });

      return res.status(200).json({
        message: 'Password has been reset successfully',
      });
    } catch (error) {
      logger.error('Reset password with current error:', error);
      return res.status(500).json({
        error: {
          code: 'internal_server_error',
          message: 'An error occurred while resetting your password',
        },
      });
    }
  }
}