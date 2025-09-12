// backend/src/controllers/adminController.ts - NEW FILE
import { Request, Response } from 'express';
import { adminService } from '../services/adminService';
import { systemHealthService } from '../services/systemHealthService';
import { dbConnectionService } from '../services/dbConnectionService';
import { modelService } from '../services/modelService';
import { userService } from '../services/userService';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';

export const adminController = {
  // System Stats
  getSystemStats: asyncHandler(async (req: Request, res: Response) => {
    const stats = await adminService.getSystemStats();
    res.json(stats);
  }),

  getHealthStatus: asyncHandler(async (req: Request, res: Response) => {
    const health = await systemHealthService.checkSystemHealth();
    res.json(health);
  }),

  // Users
  listUsers: asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 20, q, role } = req.query as any;
    const result = await userService.listUsers({ page: Number(page), limit: Number(limit), q, role });
    res.json({ ...result, totalPages: Math.ceil(result.totalCount / result.limit) });
  }),
  createUser: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.createUser(req.body);
    res.status(201).json(user);
  }),
  updateUser: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = await userService.updateUser(id, req.body);
    if (!user) throw new AppError('User not found', 404);
    res.json(user);
  }),
  deleteUser: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await userService.deleteUser(id);
    res.status(204).send();
  }),
  updateUserRole: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { role } = req.body || {};
    if (!role) throw new AppError('role is required', 400);
    const user = await userService.updateUserRole(id, role);
    if (!user) throw new AppError('User not found', 404);
    res.json(user);
  }),

  // Database Connections
  getDbConnections: asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 20, q } = req.query;
    
    const result = await dbConnectionService.getConnections({
      page: Number(page),
      limit: Number(limit),
      search: q as string,
    });

    res.json({
      connections: result.connections,
      totalCount: result.totalCount,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.totalCount / result.limit),
    });
  }),

  createDbConnection: asyncHandler(async (req: Request, res: Response) => {
    const connection = await dbConnectionService.createConnection(req.body);
    res.status(201).json(connection);
  }),

  updateDbConnection: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const connection = await dbConnectionService.updateConnection(id, req.body);
    
    if (!connection) {
      throw new AppError('Database connection not found', 404);
    }
    
    res.json(connection);
  }),

  deleteDbConnection: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await dbConnectionService.deleteConnection(id);
    res.status(204).send();
  }),

  testDbConnection: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await dbConnectionService.testConnection(id);
    res.json(result);
  }),

  // Models Management
  getModels: asyncHandler(async (req: Request, res: Response) => {
    const models = await modelService.getModels();
    res.json({ models });
  }),

  createModel: asyncHandler(async (req: Request, res: Response) => {
    const model = await modelService.createModel(req.body);
    res.status(201).json(model);
  }),

  updateModel: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const model = await modelService.updateModel(id, req.body);
    
    if (!model) {
      throw new AppError('Model not found', 404);
    }
    
    res.json(model);
  }),

  deleteModel: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await modelService.deleteModel(id);
    res.status(204).send();
  }),
};
