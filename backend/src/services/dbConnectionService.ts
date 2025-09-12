// backend/src/services/dbConnectionService.ts
// Minimal service stub to satisfy imports; replace with real implementation as needed

interface ListParams { page: number; limit: number; search?: string }

export const dbConnectionService = {
  async getConnections({ page, limit, search }: ListParams) {
    // Return empty list with pagination metadata
    return { connections: [], totalCount: 0, page, limit };
  },
  async createConnection(data: any) {
    return { id: 'conn_' + Date.now(), ...data };
  },
  async updateConnection(id: string, data: any) {
    return { id, ...data };
  },
  async deleteConnection(id: string) {
    return { success: true };
  },
  async testConnection(id: string) {
    return { id, status: 'ok' };
  }
};