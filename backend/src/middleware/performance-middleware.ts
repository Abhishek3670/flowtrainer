import { Request, Response, NextFunction } from 'express';
import { performanceMonitor } from '../profiling/performance-monitor';

// Start monitoring once
performanceMonitor.startMonitoring();

// Log threshold and slow-request events
performanceMonitor.on('threshold-exceeded', msg => console.warn(`⚠️ ${msg}`));
performanceMonitor.on('slow-request', r => console.warn(`🐌 Slow request: ${r.method} ${r.path} took ${r.duration}ms`));

export const performanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startMem = process.memoryUsage().heapUsed;
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const memDelta = process.memoryUsage().heapUsed - startMem;

    performanceMonitor.recordRequest({
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      memoryUsage: Math.round(memDelta / 1024),
      timestamp: new Date()
    });
  });

  next();
};

export const getPerformanceReport = () => performanceMonitor.getPerformanceReport();

export const exportPerformanceData = (format: 'json' | 'csv' = 'json') =>
  performanceMonitor.exportData(format);
