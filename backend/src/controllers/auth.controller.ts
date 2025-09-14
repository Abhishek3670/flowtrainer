import { Request, Response } from 'express';
import { generateTokens, verifyRefreshToken } from '../utils/jwt';
import { User } from '../models/User';
import bcrypt from 'bcrypt';

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

      // Create new user
      const user = new User({
        email,
        password,
        firstName,
        lastName,
        role: 'user', // Default role
        permissions: [], // Default permissions
      });

      await user.save();

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
      console.error('Registration error:', error);
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

      // Find user by email
      const user = await User.findOne({ email });
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

      // Return access token and user data
      return res.json({
        accessToken: tokens.accessToken,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          permissions: user.permissions,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
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
      console.error('Refresh token error:', error);
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
      console.error('Logout error:', error);
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
        role: userData.role,
        permissions: userData.permissions,
      });
    } catch (error) {
      console.error('Get current user error:', error);
      return res.status(500).json({
        error: {
          code: 'internal_server_error',
          message: 'An error occurred while fetching user data',
        },
      });
    }
  }
}
