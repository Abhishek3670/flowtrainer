// backend/src/validations/adminValidation.ts
import { Request } from 'express';

export const adminValidation = {
  async createDbConnection(req: Request): Promise<void | string> {
    const { name, type, host } = req.body || {};
    if (!name || !type) return 'name and type are required';
    if (type !== 'postgresql' && type !== 'mysql' && type !== 'mongodb') return 'Unsupported db type';
    if (type !== 'sqlite' && !host) return 'host is required for non-sqlite types';
    return undefined;
  },
  async updateDbConnection(req: Request): Promise<void | string> {
    const { id } = req.params || {};
    if (!id) return 'id param is required';
    return undefined;
  },
  async createModel(req: Request): Promise<void | string> {
    const { name } = req.body || {};
    if (!name) return 'name is required';
    return undefined;
  },
  async updateModel(req: Request): Promise<void | string> {
    const { id } = req.params || {};
    if (!id) return 'id param is required';
    return undefined;
  }
};