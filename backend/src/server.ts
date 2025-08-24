/**
 * FlowCraft Backend Server
 * 
 * Main server file that sets up the Express application, MongoDB connection,
 * WebSocket server for real-time collaboration, and all API routes.
 * 
 * Key Features:
 * - RESTful API endpoints for workflows, checkpoints, and files
 * - Real-time WebSocket communication for collaborative editing
 * - MongoDB integration for data persistence
 * - CORS support for frontend integration
 * - Health check endpoint for monitoring
 * - Error handling and logging
 * 
 * Architecture:
 * - Express.js for HTTP server
 * - Socket.io for WebSocket functionality
 * - Mongoose for MongoDB operations
 * - Modular route structure
 */
import { connectDB, getDBHealth } from './database/connection';
import { createIndexes, dropConflictingIndexes } from "./database/createIndexes";
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';

// Import API routes
import workflowRoutes from './routes/workflowRoutes';
import fileRoutes from './routes/fileRoutes';
import checkpointRoutes from './routes/checkpoints';
import projectRoutes from './routes/projectRoutes';

// ===== SERVER SETUP =====

// Create Express application instance
const app = express();

// Create HTTP server from Express app
const server = createServer(app);

// Create Socket.io server for real-time communication
const io = new SocketIOServer(server, { 
  cors: { 
    // Configure CORS for WebSocket connections
    origin: process.env.NODE_ENV === 'production' ? false : ["http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE"]
  } 
});

// ===== MIDDLEWARE CONFIGURATION =====

// Enable CORS for cross-origin requests
app.use(cors());

// Parse JSON payloads with size limit for large workflow data
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// ===== API ROUTES =====

// Workflow management endpoints
app.use('/api/workflows', workflowRoutes);

// Checkpoint management endpoints (nested under workflows)
app.use('/api/workflows/:id/checkpoints', checkpointRoutes);

// File upload and management endpoints
app.use('/api/files', fileRoutes);

// Project management endpoints
app.use('/api/projects', projectRoutes);

// Static file serving for uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ===== HEALTH CHECK ENDPOINT =====

/**
 * Health check endpoint for monitoring and load balancers
 * Returns server status, uptime, and timestamp
 */
app.get('/api/health', async (req, res) => {
  const dbHealth = await getDBHealth();
  
  res.json({
    success: true,
    message: 'FlowCraft API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbHealth,
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
    },
  });
});

// ===== WEBSOCKET REAL-TIME COLLABORATION =====

// Handle WebSocket connections for real-time workflow collaboration
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  /**
   * Join a specific workflow room for collaborative editing
   * Users in the same room receive updates from each other
   */
  socket.on('join-workflow', (workflowId: string) => {
    socket.join(`workflow-${workflowId}`);
    // Notify other users in the workflow that someone joined
    socket.to(`workflow-${workflowId}`).emit('user-joined', socket.id);
  });
  
  /**
   * Handle workflow updates and broadcast to other users
   * Enables real-time collaboration on workflow modifications
   */
  socket.on('workflow-update', (data: any) => {
    socket.to(`workflow-${data.workflowId}`).emit('workflow-update', {
      ...data,
      userId: socket.id
    });
  });
  
  /**
   * Handle canvas updates and broadcast to all connected users
   * Used for general canvas state changes
   */
  socket.on('canvas-update', (data: any) => {
    socket.broadcast.emit('canvas-update', data);
  });
  
  /**
   * Handle user disconnection
   * Logs when users leave the collaborative session
   */
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// ===== DATABASE CONNECTION =====

// MongoDB connection configuration
const MONGO_URI: string = process.env.MONGO_URI || 'mongodb://localhost:27017/flowcraft';
const PORT: number = parseInt(process.env.PORT || '4000', 10);

console.log('Attempting to connect to MongoDB with URI:', MONGO_URI);

// Connect to MongoDB and start the server

// For production: Consider running this in an admin/init script or a migration tool so you don't block server startup if indexes take time to build on large datasets.
// For development: This pattern is ideal—fast, idempotent, and keeps your schema healthy.
connectDB()
  .then(async () => {
    console.log('✅ Database connection established');

    await dropConflictingIndexes();
    await createIndexes();
    // Start HTTP server after successful database connection
    server.listen(PORT, () => {
      console.log(`🚀 FlowCraft backend listening on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📁 Workflow API: http://localhost:${PORT}/api/workflows`);
    });
  })
  .catch((err: Error) => {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  });

// ===== ERROR HANDLING =====

/**
 * Global error handling middleware
 * Catches any unhandled errors and returns appropriate error responses
 */
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    // Only expose error details in development mode
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ===== 404 HANDLER =====

/**
 * 404 handler for undefined API endpoints
 * Returns consistent error response for missing routes
 */
app.use('*', (req: express.Request, res: express.Response) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Export the Express app for testing purposes
export default app;
