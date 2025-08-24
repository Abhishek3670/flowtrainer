// src/profiling/performance-monitor.ts

import { EventEmitter } from 'events';
import pidusage from 'pidusage';
import { performance, PerformanceObserver, PerformanceEntry } from 'perf_hooks';

export interface PerformanceMetrics {
  timestamp: Date;
  memory: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
    arrayBuffers: number;
  };
  cpu: {
    usage: number;
    userTime: number;
    systemTime: number;
  };
  eventLoop: {
    lag: number;
    utilization: number;
  };
  gc: { type: string; duration: number; timestamp: Date }[];
  uptime: number;
}

export interface RequestMetrics {
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  memoryUsage: number;
  timestamp: Date;
}

export class PerformanceMonitor extends EventEmitter {
  private metricsHistory: PerformanceMetrics[] = [];
  private requestHistory: RequestMetrics[] = [];
  private gcData: PerformanceMetrics['gc'] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private startTime = Date.now();

  constructor(
    private options: {
      collectInterval: number;
      maxHistorySize: number;
      enableGCMonitoring: boolean;
    } = { collectInterval: 5000, maxHistorySize: 500, enableGCMonitoring: true }
  ) {
    super();
    if (this.options.enableGCMonitoring) this.setupGCMonitoring();
  }

  private setupGCMonitoring() {
    const obs = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'gc') {
          const e = entry as PerformanceEntry & { kind: number; duration: number; startTime: number };
          this.gcData.push({
            type: this.getGCType(e.kind),
            duration: Math.round(e.duration),
            timestamp: new Date(e.startTime + performance.timeOrigin)
          });
        }
      }
      // Cap GC data history
      if (this.gcData.length > 100) this.gcData.shift();
    });
    obs.observe({ entryTypes: ['gc'] });
  }

  private getGCType(kind: number): string {
    const map: Record<number, string> = {
      1: 'Scavenge',
      2: 'Mark-Sweep-Compact',
      4: 'Incremental-Marking',
      8: 'Weak-Phantom',
      15: 'All'
    };
    return map[kind] || 'Unknown';
  }

  public startMonitoring() {
    if (this.monitoringInterval) return;
    this.monitoringInterval = setInterval(() => this.collectAndEmit(), this.options.collectInterval);
    console.log('📊 Performance monitoring started');
  }

  public stopMonitoring() {
    if (!this.monitoringInterval) return;
    clearInterval(this.monitoringInterval);
    this.monitoringInterval = null;
    console.log('⏹️ Performance monitoring stopped');
  }

  private async collectAndEmit() {
    const metrics = await this.collectMetrics();
    this.metricsHistory.push(metrics);
    // Cap metrics history
    if (this.metricsHistory.length > 100) this.metricsHistory.shift();
    this.emit('metrics', metrics);
    this.checkThresholds(metrics);
  }

  private async collectMetrics(): Promise<PerformanceMetrics> {
    const mem = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    let cpuPercent = 0;
    try {
      cpuPercent = (await pidusage(process.pid)).cpu;
    } catch {}
    const lag = await this.measureEventLoopLag();
    return {
      timestamp: new Date(),
      memory: {
        heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
        external: Math.round(mem.external / 1024 / 1024),
        rss: Math.round(mem.rss / 1024 / 1024),
        arrayBuffers: Math.round((mem as any).arrayBuffers / 1024 / 1024)
      },
      cpu: { usage: Math.round(cpuPercent * 100) / 100, userTime: cpuUsage.user, systemTime: cpuUsage.system },
      eventLoop: { lag, utilization: this.calculateEventLoopUtilization() },
      gc: this.gcData.filter(d => d.timestamp.getTime() > Date.now() - 5 * 60 * 1000).slice(-10),
      uptime: Math.round((Date.now() - this.startTime) / 1000)
    };
  }

  private measureEventLoopLag(): Promise<number> {
    const start = process.hrtime.bigint();
    return new Promise(resolve =>
      setImmediate(() => resolve(Number(process.hrtime.bigint() - start) / 1e6))
    );
  }

  private calculateEventLoopUtilization(): number {
    try {
      // @ts-ignore
      const u = performance.eventLoopUtilization();
      return Math.round(u.utilization * 10000) / 100;
    } catch {
      return 0;
    }
  }

  public recordRequest(r: RequestMetrics) {
    this.requestHistory.push(r);
    // Cap request history
    if (this.requestHistory.length > 100) this.requestHistory.shift();
    if (r.duration > 1000) this.emit('slow-request', r);
  }

  private checkThresholds(m: PerformanceMetrics) {
    if (m.memory.heapUsed > 500) this.emit('threshold-exceeded', `Heap >500MB: ${m.memory.heapUsed}MB`);
    if (m.cpu.usage > 80) this.emit('threshold-exceeded', `CPU >80%: ${m.cpu.usage}%`);
    if (m.eventLoop.lag > 100) this.emit('threshold-exceeded', `Event loop lag >100ms: ${m.eventLoop.lag}ms`);
  }

  public getPerformanceReport() {
    const current = this.metricsHistory.slice(-1)[0] || null;
    return {
      current,
      averages: this.calculateAverages(),
      peaks: this.calculatePeaks(),
      requestStats: this.calculateRequestStats(),
      recommendations: this.generateRecommendations(current)
    };
  }

  private calculateAverages() {
    if (!this.metricsHistory.length) return {};
    const sum = this.metricsHistory.reduce(
      (acc, m) => ({
        heapUsed: acc.heapUsed + m.memory.heapUsed,
        cpu: acc.cpu + m.cpu.usage,
        lag: acc.lag + m.eventLoop.lag
      }),
      { heapUsed: 0, cpu: 0, lag: 0 }
    );
    const count = this.metricsHistory.length;
    return {
      memory: { heapUsed: Math.round(sum.heapUsed / count) },
      cpu: { usage: Math.round((sum.cpu / count) * 100) / 100 },
      eventLoop: { lag: Math.round(sum.lag / count) }
    };
  }

  private calculatePeaks() {
    if (!this.metricsHistory.length) return {};
    return {
      memory: { heapUsed: Math.max(...this.metricsHistory.map(m => m.memory.heapUsed)) },
      cpu: { usage: Math.max(...this.metricsHistory.map(m => m.cpu.usage)) },
      eventLoop: { lag: Math.max(...this.metricsHistory.map(m => m.eventLoop.lag)) }
    };
  }

  private calculateRequestStats() {
    const total = this.requestHistory.length;
    if (!total) return { total: 0, avg: 0, slow: 0, errors: 0 };
    const sumDur = this.requestHistory.reduce((a, r) => a + r.duration, 0);
    const slow = this.requestHistory.filter(r => r.duration > 1000).length;
    const errors = this.requestHistory.filter(r => r.statusCode >= 400).length;
    return {
      total,
      avg: Math.round(sumDur / total),
      slow,
      errors: Math.round((errors / total) * 100)
    };
  }

  private generateRecommendations(current: PerformanceMetrics | null) {
    const recs: string[] = [];
    if (current) {
      if (current.memory.heapUsed > 400) recs.push('Optimize memory usage.');
      if (current.cpu.usage > 60) recs.push('Optimize CPU-heavy tasks.');
      if (current.eventLoop.lag > 50) recs.push('Investigate event loop blockers.');
    }
    return recs.length ? recs : ['Performance within acceptable limits.'];
  }

  public exportData(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const hdr = 'timestamp,heapUsed,cpu,lag,requests\n';
      const rows = this.metricsHistory
        .map(m => `${m.timestamp.toISOString()},${m.memory.heapUsed},${m.cpu.usage},${m.eventLoop.lag},${this.requestHistory.length}`)
        .join('\n');
      return hdr + rows;
    }
    return JSON.stringify({ metrics: this.metricsHistory, requests: this.requestHistory }, null, 2);
  }
}

export const performanceMonitor = new PerformanceMonitor();
