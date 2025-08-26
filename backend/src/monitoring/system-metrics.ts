import * as si from 'systeminformation';

export interface SystemMetrics {
  cpu: {
    usage: number;
    temperature: number;
  };
  memory: {
    total: number;
    used: number;
    available: number;
    usagePercent: number;
  };
  nodejs: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  timestamp: Date;
}

export class SystemMetricsCollector {
  async collectMetrics(): Promise<SystemMetrics> {
    const [cpuData, memData, cpuTemp] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.cpuTemperature().catch(() => ({ main: 0 })) // Fallback for systems without temp sensors
    ]);

    const nodeMemory = process.memoryUsage();

    return {
      cpu: {
        usage: Math.round(cpuData.currentLoad),
        temperature: cpuTemp.main || 0
      },
      memory: {
        total: Math.round(memData.total / 1024 / 1024), // MB
        used: Math.round(memData.used / 1024 / 1024), // MB
        available: Math.round(memData.available / 1024 / 1024), // MB
        usagePercent: Math.round((memData.used / memData.total) * 100)
      },
      nodejs: {
        heapUsed: Math.round(nodeMemory.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(nodeMemory.heapTotal / 1024 / 1024), // MB
        external: Math.round(nodeMemory.external / 1024 / 1024), // MB
        rss: Math.round(nodeMemory.rss / 1024 / 1024) // MB
      },
      timestamp: new Date()
    };
  }

  async startContinuousMonitoring(intervalMs: number = 30000): Promise<void> {
    console.log('📊 Starting continuous system monitoring...');
    
    setInterval(async () => {
      try {
        const metrics = await this.collectMetrics();
        
        // Log metrics
        console.log('📊 System Metrics:', {
          cpu: `${metrics.cpu.usage}%`,
          memory: `${metrics.memory.usagePercent}% (${metrics.memory.used}MB/${metrics.memory.total}MB)`,
          nodejs_heap: `${metrics.nodejs.heapUsed}MB`,
          timestamp: metrics.timestamp.toISOString()
        });

        // Alert on high resource usage
        if (metrics.cpu.usage > 80) {
          console.warn('⚠️ High CPU usage detected:', metrics.cpu.usage, '%');
        }
        
        if (metrics.memory.usagePercent > 85) {
          console.warn('⚠️ High memory usage detected:', metrics.memory.usagePercent, '%');
        }

        if (metrics.nodejs.heapUsed > 500) {
          console.warn('⚠️ High Node.js heap usage detected:', metrics.nodejs.heapUsed, 'MB');
        }

      } catch (error) {
        console.error('Error collecting system metrics:', error);
      }
    }, intervalMs);
  }
}
