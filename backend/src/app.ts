/**
 * FlowCraft Express Application Configuration
 * 
 * This file sets up the Express application with middleware and routes.
 * It serves as a modular configuration that can be imported and used
 * by the main server or for testing purposes.
 * 
 * Key Features:
 * - CORS configuration for cross-origin requests
 * - Request logging with Morgan
 * - JSON body parsing
 * - Modular route organization
 * 
 * Note: This appears to be a secondary configuration file that may
 * be used for testing or alternative server setups.
 */

import express, { Application, Request, Response, NextFunction, Router } from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createClient } from 'redis';
import cookieParser from 'cookie-parser';
import path from 'path';
import { initRateLimiter } from './middleware/rateLimit';
import { authenticate } from './middleware/auth';
import authRoutes from './routes/auth.routes';
import checkpointRoutes from "./routes/checkpoints";
import cleanupRoutes from "./routes/cleanup";
import projectRoutes from "./routes/projectRoutes";
import adminRoutes from "./routes/admin";
import workflowRoutes from "./routes/workflowRoutes";
import { performanceMiddleware, getPerformanceReport, exportPerformanceData } from './middleware/performance-middleware';
import { performanceOptimization, getCacheStats, clearCache } from './middleware/performance-optimization';
import { SystemMetricsCollector } from './monitoring/system-metrics';
import logger from './utils/logger';
import config from './config/config';

// Create Express application instance
const app: Application = express();

// Initialize the API router
const apiRouter = Router();

// Initialize rate limiter
initRateLimiter().catch(err => {
  logger.error('Failed to initialize rate limiter:', err);
  process.exit(1);
});

// ===== MIDDLEWARE CONFIGURATION =====

// Security middleware
app.use(helmet());

// Trust first proxy (for secure cookies in production)
app.set('trust proxy', 1);

// Parse cookies
app.use(cookieParser());

// Enable CORS for cross-origin requests
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGINS?.split(',') || true 
    : true,
  credentials: true
}));

// Add HTTP request logging for development and debugging
app.use(morgan("dev", {
  stream: {
    write: (message: string) => logger.info(message.trim())
  }
}));

// Parse JSON request bodies with size limit
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Rate limiting for API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

// ===== ROUTE REGISTRATION =====

// Mount all API routes under /api
apiRouter.use('/auth', authRoutes);
apiRouter.use('/workflows', workflowRoutes);
apiRouter.use('/checkpoints', checkpointRoutes);
apiRouter.use('/cleanup', cleanupRoutes);
apiRouter.use('/projects', projectRoutes);
apiRouter.use('/admin', adminRoutes);

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// Mount the API router under /api
app.use('/api', apiRouter);

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: 'The requested resource was not found on this server'
  });
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  // Log the error
  logger.error('Unhandled error:', err);
  
  // Default error status and message
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  // Send error response
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Performance recommendations
const performanceRecommendations = [
  'Use worker threads for CPU-intensive tasks',
  'Implement database connection pooling',
  'Enable response compression',
  'Monitor memory usage and implement cleanup'
];

// Export the configured Express application
export default app;
