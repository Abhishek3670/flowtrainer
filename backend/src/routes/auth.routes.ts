import { Router, Request, Response, NextFunction } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validate } from '../middleware/validation';
import { body, validationResult } from 'express-validator';
import { loginLimiter, registerLimiter, refreshTokenLimiter } from '../middleware/authRateLimit';
import { authenticate } from '../middleware/auth';

const router = Router();

// Create individual validation middleware functions
const validateEmail = body('email').isEmail().normalizeEmail();
const validatePassword = body('password').isString().notEmpty();
const validateFirstName = body('firstName').isString().trim().notEmpty();
const validateLastName = body('lastName').isString().trim().notEmpty();
const validateResetToken = body('token').isString().notEmpty();
const validateNewPassword = body('newPassword').isString().isLength({ min: 8 });

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate user and get tokens
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Authentication successful
 *       401:
 *         description: Invalid credentials
 */
router.post(
  '/login',
  validateEmail,
  validatePassword,
  (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      res.status(400).json({
        error: {
          code: 'validation_error',
          message: 'Validation failed',
          details: errors.array().map((err: any) => {
            // Type assertion to any to access the properties
            const error = err as any;
            return {
              param: error.param,
              message: typeof error.msg === 'string' ? error.msg : 'Invalid value',
              location: error.location,
              value: error.value,
            };
          }),
        },
      });
      return;
    }
    
    next();
  },
  AuthController.login
);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Invalid request
 */
router.post(
  '/register',
  registerLimiter,
  validateEmail,
  validatePassword,
  validateFirstName,
  validateLastName,
  (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      res.status(400).json({
        error: {
          code: 'validation_error',
          message: 'Validation failed',
          details: errors.array().map((err: any) => {
            // Type assertion to any to access the properties
            const error = err as any;
            return {
              param: error.param,
              message: typeof error.msg === 'string' ? error.msg : 'Invalid value',
              location: error.location,
              value: error.value,
            };
          }),
        },
      });
      return;
    }
    
    next();
  },
  AuthController.register
);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: New access token generated
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post(
  '/refresh',
  refreshTokenLimiter,
  AuthController.refreshToken
);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     responses:
 *       204:
 *         description: Logout successful
 */
router.post('/logout', AuthController.logout);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user information
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved successfully
 *       401:
 *         description: Not authenticated
 */
router.get('/me', authenticate, AuthController.getCurrentUser);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Initiate password reset process
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Password reset email sent (if email exists)
 *       400:
 *         description: Validation error
 */
router.post(
  '/forgot-password',
  validateEmail,
  (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      res.status(400).json({
        error: {
          code: 'validation_error',
          message: 'Validation failed',
          details: errors.array().map((err: any) => {
            const error = err as any;
            return {
              param: error.param,
              message: typeof error.msg === 'string' ? error.msg : 'Invalid value',
              location: error.location,
              value: error.value,
            };
          }),
        },
      });
      return;
    }
    
    next();
  },
  AuthController.forgotPassword
);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset user password with token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid token or validation error
 */
router.post(
  '/reset-password',
  validateResetToken,
  validateNewPassword,
  (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      res.status(400).json({
        error: {
          code: 'validation_error',
          message: 'Validation failed',
          details: errors.array().map((err: any) => {
            const error = err as any;
            return {
              param: error.param,
              message: typeof error.msg === 'string' ? error.msg : 'Invalid value',
              location: error.location,
              value: error.value,
            };
          }),
        },
      });
      return;
    }
    
    next();
  },
  AuthController.resetPassword
);

export default router;