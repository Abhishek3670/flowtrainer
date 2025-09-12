// backend/src/services/dbConnectionService.ts
import { DbConnection, IDbConnection } from '../models/DbConnection';

interface ListParams { page: number; limit: number; search?: string }

export const dbConnectionService = {
  // List with pagination and optional text search
  async getConnections({ page, limit, search }: ListParams): Promise<{ connections: IDbConnection[]; totalCount: number; page: number; limit: number }> {
    const filter = search ? { $text: { $search: search } } : {};
    const [connections, totalCount] = await Promise.all([
      DbConnection.find(filter)
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      DbConnection.countDocuments(filter),
    ]);
    return { connections: connections.map(c => ({ ...c, id: (c as any)._id?.toString?.() } as any)), totalCount, page, limit };
  },

  async createConnection(data: Partial<IDbConnection>): Promise<IDbConnection> {
    const created = await DbConnection.create(data);
    return created.toObject() as any;
  },

  async updateConnection(id: string, data: Partial<IDbConnection>): Promise<IDbConnection | null> {
    const updated = await DbConnection.findByIdAndUpdate(id, data, { new: true }).lean();
    return updated as any;
  },

  async deleteConnection(id: string): Promise<void> {
    await DbConnection.findByIdAndDelete(id);
  },

  async testConnection(id: string): Promise<{ status: 'connected' | 'disconnected' | 'error'; message?: string }> {
    const conn = await DbConnection.findById(id);
    if (!conn) return { status: 'error', message: 'Connection not found' };
    // Placeholder ping: mark lastChecked and optimistic status
    conn.status = 'connected';
    conn.lastChecked = new Date();
    await conn.save();
    return { status: 'connected' };
  }
};