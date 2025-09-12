// backend/src/services/adminService.ts - NEW FILE
import { User } from '../models/User';
// Workflow is a JS model; require to avoid TS type import error
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Workflow = require('../models/Workflow');
import { systemHealthService } from './systemHealthService';
import { DbConnection } from '../models/DbConnection';
import { ModelConfig } from '../models/ModelConfig';
import os from 'os';

export const adminService = {
  async getSystemStats() {
    const [
      userCount,
      workflowCount,
      dbConnectionCount,
      modelCount,
      healthStatus,
    ] = await Promise.all([
      User.countDocuments(),
      Workflow.countDocuments?.() ?? 0,
      DbConnection.countDocuments(),
      ModelConfig.countDocuments(),
      systemHealthService.checkSystemHealth(),
    ]);

    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    return {
      userCount,
      workflowCount,
      dbConnectionCount,
      modelCount,
      systemHealth: healthStatus.status,
      memoryUsage: {
        used: Math.round(usedMemory / 1024 / 1024), // MB
        total: Math.round(totalMemory / 1024 / 1024), // MB
        percentage: Math.round((usedMemory / totalMemory) * 100),
      },
      cpuUsage: await getCpuUsage(),
      diskUsage: await getDiskUsage(),
      uptime: Math.round(process.uptime()),
      activeExecutions: await getActiveExecutions(),
    };
  },
};

async function getCpuUsage(): Promise<number> {
  const cpus = os.cpus();
  let totalIdle = 0;
  let totalTick = 0;

  cpus.forEach(cpu => {
    for (const type in cpu.times) {
      totalTick += cpu.times[type as keyof typeof cpu.times];
    }
    totalIdle += cpu.times.idle;
  });

  return Math.round(100 - (totalIdle * 100) / totalTick);
}

async function getDiskUsage(): Promise<{ used: number; total: number; percentage: number }> {
  // Placeholder implementation
  return { used: 50000, total: 100000, percentage: 50 };
}

async function getActiveExecutions(): Promise<number> {
  // Placeholder based on execution tracking implementation
  return 0;
}
