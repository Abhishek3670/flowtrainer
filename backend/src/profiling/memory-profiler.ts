import { EventEmitter } from 'events';

export interface MemoryMetrics {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  cpu: number;
  timestamp: Date;
}

export class MemoryProfiler extends EventEmitter {
  private isMonitoring = false;
  private interval: NodeJS.Timeout | null = null;
  private baseline: MemoryMetrics | null = null;
  private metrics: MemoryMetrics[] = [];

  constructor(private intervalMs: number = 5000) {
    super();
  }

  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.baseline = this.getCurrentMetrics();
    
    this.interval = setInterval(() => {
      const metrics = this.getCurrentMetrics();
      this.metrics.push(metrics);
      this.emit('metrics', metrics);
      
      // Check for memory leaks
      if (this.detectMemoryLeak(metrics)) {
        this.emit('memory-leak', metrics);
      }
    }, this.intervalMs);

    console.log('🔍 Memory profiling started');
  }

  stopMonitoring(): MemoryMetrics[] {
    if (!this.isMonitoring) return [];

    this.isMonitoring = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    console.log('⏹️ Memory profiling stopped');
    return this.metrics;
  }

  private getCurrentMetrics(): MemoryMetrics {
    const memUsage = process.memoryUsage();
    return {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      external: Math.round(memUsage.external / 1024 / 1024), // MB
      rss: Math.round(memUsage.rss / 1024 / 1024), // MB
      cpu: 0, // Will be populated by pidusage
      timestamp: new Date()
    };
  }

  private detectMemoryLeak(current: MemoryMetrics): boolean {
    if (!this.baseline) return false;
    
    // Alert if heap usage increased by more than 100MB from baseline
    const heapIncrease = current.heapUsed - this.baseline.heapUsed;
    return heapIncrease > 100;
  }

  getReport(): {
    baseline: MemoryMetrics | null;
    current: MemoryMetrics;
    peak: MemoryMetrics;
    average: Partial<MemoryMetrics>;
    leakDetected: boolean;
  } {
    const current = this.getCurrentMetrics();
    const peak = this.metrics.reduce((max, metric) => 
      metric.heapUsed > max.heapUsed ? metric : max, 
      this.baseline || current
    );

    const average = this.calculateAverage();
    const leakDetected = this.detectMemoryLeak(current);

    return { baseline: this.baseline, current, peak, average, leakDetected };
  }

  private calculateAverage(): Partial<MemoryMetrics> {
    if (this.metrics.length === 0) return {};

    const sums = this.metrics.reduce((acc, metric) => ({
      heapUsed: acc.heapUsed + metric.heapUsed,
      heapTotal: acc.heapTotal + metric.heapTotal,
      external: acc.external + metric.external,
      rss: acc.rss + metric.rss,
    }), { heapUsed: 0, heapTotal: 0, external: 0, rss: 0 });

    const count = this.metrics.length;
    return {
      heapUsed: Math.round(sums.heapUsed / count),
      heapTotal: Math.round(sums.heapTotal / count),
      external: Math.round(sums.external / count),
      rss: Math.round(sums.rss / count),
    };
  }
}
