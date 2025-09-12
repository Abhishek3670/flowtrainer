// backend/src/services/systemHealthService.ts
import os from 'os';

export const systemHealthService = {
  async checkSystemHealth() {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    return {
      status: 'healthy',
      memory: {
        used,
        total,
        percentage: Math.round((used / total) * 100)
      },
      uptime: os.uptime()
    };
  }
};