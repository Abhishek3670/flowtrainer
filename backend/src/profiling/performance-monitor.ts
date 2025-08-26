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
  private isHighLoad = false;
  private lastMemoryCheck = Date.now();

  constructor(
    private options: {
      collectInterval: number;
      maxHistorySize: number;
      enableGCMonitoring: boolean;
      adaptiveCapping: boolean;
    } = { 
      collectInterval: 5000, 
      maxHistorySize: 50, // Reduced from 500 to 50
      enableGCMonitoring: true,
      adaptiveCapping: true
    }
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
      // Reduced GC data history from 100 to 20 entries
      if (this.gcData.length > 20) this.gcData.shift();
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
    
    // Adaptive capping based on system load
    if (this.options.adaptiveCapping) {
      this.adaptiveCapHistory(metrics);
    } else {
      this.metricsHistory.push(metrics);
      if (this.metricsHistory.length > this.options.maxHistorySize) {
        this.metricsHistory.shift();
      }
    }
    
    this.emit('metrics', metrics);
    this.checkThresholds(metrics);
    
    // Memory leak detection
    this.detectMemoryLeaks(metrics);
  }

  private adaptiveCapHistory(metrics: PerformanceMetrics) {
    const currentHeap = metrics.memory.heapUsed;
    const currentTime = Date.now();
    
    // Check if we're under high load
    this.isHighLoad = currentHeap > 400 || metrics.cpu.usage > 70;
    
    if (this.isHighLoad) {
      // Under high load, keep only recent data
      this.metricsHistory.push(metrics);
      if (this.metricsHistory.length > 25) { // Reduced from 50 to 25 under high load
        this.metricsHistory = this.metricsHistory.slice(-25);
      }
    } else {
      // Normal load, use standard capping
      this.metricsHistory.push(metrics);
      if (this.metricsHistory.length > this.options.maxHistorySize) {
        this.metricsHistory.shift();
      }
    }
  }

  private detectMemoryLeaks(metrics: PerformanceMetrics) {
    const now = Date.now();
    const timeSinceLastCheck = now - this.lastMemoryCheck;
    
    // Check for memory leaks every 30 seconds
    if (timeSinceLastCheck > 30000) {
      this.lastMemoryCheck = now;
      
      // If heap usage increased by more than 100MB in 30 seconds, potential leak
      if (this.metricsHistory.length > 1) {
        const previous = this.metricsHistory[this.metricsHistory.length - 2];
        const heapIncrease = metrics.memory.heapUsed - previous.memory.heapUsed;
        
        if (heapIncrease > 100) {
          this.emit('memory-leak-detected', {
            increase: heapIncrease,
            current: metrics.memory.heapUsed,
            previous: previous.memory.heapUsed,
            timestamp: new Date()
          });
          console.warn(`⚠️ Potential memory leak detected: +${heapIncrease}MB in 30s`);
        }
      }
    }
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
      gc: this.gcData.filter(d => d.timestamp.getTime() > Date.now() - 5 * 60 * 1000).slice(-5), // Reduced from 10 to 5
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
    
    // Adaptive capping for request history
    if (this.isHighLoad) {
      if (this.requestHistory.length > 25) { // Reduced from 100 to 25 under high load
        this.requestHistory = this.requestHistory.slice(-25);
      }
    } else {
      if (this.requestHistory.length > 50) { // Reduced from 100 to 50 under normal load
        this.requestHistory.shift();
      }
    }
    
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
      recommendations: this.generateRecommendations(current),
      systemLoad: this.isHighLoad ? 'high' : 'normal',
      historySize: {
        metrics: this.metricsHistory.length,
        requests: this.requestHistory.length,
        gc: this.gcData.length
      }
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
      if (current.memory.heapUsed > 400) recs.push('Optimize memory usage - consider reducing history arrays.');
      if (current.cpu.usage > 60) recs.push('Optimize CPU-heavy tasks - consider worker threads.');
      if (current.eventLoop.lag > 50) recs.push('Investigate event loop blockers - check for sync operations.');
    }
    
    // Add adaptive recommendations
    if (this.isHighLoad) {
      recs.push('System under high load - monitoring arrays have been reduced for performance.');
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
    return JSON.stringify({ 
      metrics: this.metricsHistory, 
      requests: this.requestHistory,
      systemLoad: this.isHighLoad,
      historySizes: {
        metrics: this.metricsHistory.length,
        requests: this.requestHistory.length,
        gc: this.gcData.length
      }
    }, null, 2);
  }

  // Method to manually clear history arrays to free memory
  public clearHistory() {
    this.metricsHistory = [];
    this.requestHistory = [];
    this.gcData = [];
    console.log('🧹 Performance monitor history cleared');
  }

  // Method to get current memory usage of the monitor itself
  public getMonitorMemoryUsage() {
    return {
      metricsHistorySize: this.metricsHistory.length,
      requestHistorySize: this.requestHistory.length,
      gcDataSize: this.gcData.length,
      estimatedMemoryMB: Math.round(
        (this.metricsHistory.length * 0.5 + 
         this.requestHistory.length * 0.3 + 
         this.gcData.length * 0.2) / 1024
      )
    };
  }
}

export const performanceMonitor = new PerformanceMonitor();
