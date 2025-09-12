// backend/src/routes/admin.ts - NEW FILE
import express from 'express';
import { adminController } from '../controllers/adminController';
import { authenticate, requireRole } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { adminValidation } from '../validations/adminValidation';

const router = express.Router();

// Apply authentication to all admin routes
router.use(authenticate);
router.use(requireRole('admin'));

// System Stats & Health
router.get('/system/stats', adminController.getSystemStats);
router.get('/health', adminController.getHealthStatus);

// Database Connections
router.get('/db-connections', adminController.getDbConnections);
router.post('/db-connections', 
  validateRequest(adminValidation.createDbConnection), 
  adminController.createDbConnection
);
router.put('/db-connections/:id', 
  validateRequest(adminValidation.updateDbConnection), 
  adminController.updateDbConnection
);
router.delete('/db-connections/:id', adminController.deleteDbConnection);
router.post('/db-connections/:id/test', adminController.testDbConnection);

// Models Management  
router.get('/models', adminController.getModels);
router.post('/models', 
  validateRequest(adminValidation.createModel), 
  adminController.createModel
);
router.put('/models/:id', 
  validateRequest(adminValidation.updateModel), 
  adminController.updateModel
);
router.delete('/models/:id', adminController.deleteModel);

export { router as adminRouter };
