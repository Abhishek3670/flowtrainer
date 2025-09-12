/**
 * FlowCraft Express Application Configuration
 * 
 * This file sets up the Express application with middleware and routes.
 * It serves as a modular configuration that can be imported and used
 * by the main server or for testing purposes.
 * 
 * Key Features:
 * - CORS configuration for cross-origin requests
 * - Request logging with Morgan
 * - JSON body parsing
 * - Modular route organization
 * 
 * Note: This appears to be a secondary configuration file that may
 * be used for testing or alternative server setups.
 */

import express, { Application } from "express";
import cors from "cors";
import morgan from "morgan";
import checkpointRoutes from "./routes/checkpoints";
import cleanupRoutes from "./routes/cleanup";
import projectRoutes from './routes/projectRoutes';
import { adminRouter } from './routes/admin';
import { performanceMiddleware, getPerformanceReport, exportPerformanceData } from './middleware/performance-middleware';
import { performanceOptimization, getCacheStats, clearCache } from './middleware/performance-optimization';
import { SystemMetricsCollector } from './monitoring/system-metrics';
// Create Express application instance
const app: Application = express();

// Import workflow routes (using require for JS compatibility)
const workflowRoutes = require("./routes/workflowRoutes");

// ===== MIDDLEWARE CONFIGURATION =====

// Enable CORS for cross-origin requests
app.use(cors());

// Add HTTP request logging for development and debugging
app.use(morgan("dev"));

// Parse JSON request bodies
app.use(express.json());

// ===== ROUTE REGISTRATION =====

// Workflow management endpoints
app.use("/api/workflows", workflowRoutes);

// Checkpoint management endpoints (nested under workflows)
app.use("/api/workflows/:id/checkpoints", checkpointRoutes);

// Cleanup and maintenance endpoints
app.use("/api/cleanup", cleanupRoutes);

// Project management endpoints
app.use('/api/projects', projectRoutes);

// Admin routes
app.use('/api/admin', adminRouter);

// Add performance middleware early in the middleware stack
app.use(performanceMiddleware);
app.use(performanceOptimization);

// Start system monitoring
const systemMetrics = new SystemMetricsCollector();
systemMetrics.startContinuousMonitoring(30000); // Every 30 seconds

// Add performance endpoint
app.get('/api/performance', (req, res) => {
  const report = getPerformanceReport();
  res.json({ success: true, report });
});

app.get('/api/performance/export', (req, res) => {
  const format = req.query.format as 'json' | 'csv' || 'json';
  const data = exportPerformanceData(format);
  
  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="performance-data.csv"');
  } else {
    res.setHeader('Content-Type', 'application/json');
  }
  
  res.send(data);
});

// Cache management endpoints
app.get('/api/performance/cache', (req, res) => {
  res.json({ success: true, stats: getCacheStats() });
});

app.post('/api/performance/cache/clear', (req, res) => {
  clearCache();
  res.json({ success: true, message: 'Cache cleared successfully' });
});

// Performance optimization status
app.get('/api/performance/optimization', (req, res) => {
  const report = getPerformanceReport();
  const cacheStats = getCacheStats();
  
  res.json({
    success: true,
    performance: report,
    cache: cacheStats,
    recommendations: [
      'Use worker threads for CPU-intensive tasks',
      'Implement database connection pooling',
      'Enable response compression',
      'Monitor memory usage and implement cleanup'
    ]
  });
});

// Export the configured Express application
export default app;
