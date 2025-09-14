import { Router } from 'express';
import userRoutes from './users';
import systemRoutes from './system';
import auditRoutes from './audit';
import { authenticateJWT, requirePermission } from '../../middleware/adminAuth';
import { adminRateLimiter } from '../../middleware/rateLimit';

const router = Router();

// Health check endpoint (no auth required)
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'admin-api' });
});

// Apply authentication and rate limiting to all routes except health check
router.use(authenticateJWT);
router.use(adminRateLimiter);

// Mount routes
router.use('/users', requirePermission('manage_users'), userRoutes);
router.use('/system', requirePermission('manage_system'), systemRoutes);
router.use('/audit', requirePermission('view_audit_logs'), auditRoutes);

// 404 handler for admin routes
router.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: 'The requested admin resource was not found'
  });
});

// Error handler for admin routes
router.use((err: any, req: any, res: any, next: any) => {
  // Log the error
  console.error('Admin route error:', err);
  
  // Handle Joi validation errors
  if (err && err.error && err.error.isJoi) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: err.error.details.map((d: any) => ({
        message: d.message,
        path: d.path,
        type: d.type
      }))
    });
  }
  
  // Handle other errors
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

export default router;
