import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';

// Debug utility function
const debugLog = (component: string, action: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${component}] ${action}`, data || '');
};

// Import routes (Note: using require for now since routes are in JS)
const workflowRoutes = require('./routes/workflowRoutes');
const fileRoutes = require('./routes/fileRoutes');
const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, { 
  cors: { 
    origin: process.env.NODE_ENV === 'production' ? false : ["http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE"]
  } 
});

debugLog('Server', 'Initializing server');

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  debugLog('Server', 'HTTP Request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    debugLog('Server', 'HTTP Response', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });
  });
  
  next();
});

// API Routes
app.use('/api/workflows', workflowRoutes);
debugLog('Server', 'Workflow routes mounted');

// File Routes
app.use('/api/files', fileRoutes);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
debugLog('Server', 'File routes mounted');

// Health check endpoint
app.get('/api/health', (req, res) => {
  debugLog('Server', 'Health check requested');
  res.json({ 
    success: true, 
    message: 'FlowCraft API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Socket.io for real-time collaboration
io.on('connection', (socket) => {
  debugLog('SocketIO', 'User connected', { 
    socketId: socket.id,
    totalConnections: io.engine.clientsCount 
  });
  
  socket.on('join-workflow', (workflowId: string) => {
    debugLog('SocketIO', 'User joining workflow', { 
      socketId: socket.id, 
      workflowId 
    });
    socket.join(`workflow-${workflowId}`);
    socket.to(`workflow-${workflowId}`).emit('user-joined', socket.id);
  });
  
  socket.on('workflow-update', (data: any) => {
    debugLog('SocketIO', 'Workflow update received', { 
      socketId: socket.id,
      workflowId: data.workflowId,
      updateType: data.type 
    });
    socket.to(`workflow-${data.workflowId}`).emit('workflow-update', {
      ...data,
      userId: socket.id
    });
  });
  
  socket.on('canvas-update', (data: any) => {
    debugLog('SocketIO', 'Canvas update received', { 
      socketId: socket.id,
      updateType: data.type 
    });
    socket.broadcast.emit('canvas-update', data);
  });
  
  socket.on('disconnect', (reason) => {
    debugLog('SocketIO', 'User disconnected', { 
      socketId: socket.id, 
      reason,
      totalConnections: io.engine.clientsCount - 1
    });
  });
});

// Database connection
const MONGO_URI: string = process.env.MONGO_URI || 'mongodb://localhost:27017/flowcraft';
const PORT: number = parseInt(process.env.PORT || '4000', 10);

debugLog('Server', 'Attempting to connect to MongoDB', { uri: MONGO_URI });

mongoose.connect(MONGO_URI)
  .then(() => {
    debugLog('Server', '✅ Connected to MongoDB successfully');
    server.listen(PORT, () => {
      debugLog('Server', '🚀 FlowCraft backend listening', { 
        port: PORT,
        healthCheck: `http://localhost:${PORT}/api/health`,
        workflowAPI: `http://localhost:${PORT}/api/workflows`
      });
      console.log(`🚀 FlowCraft backend listening on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📁 Workflow API: http://localhost:${PORT}/api/workflows`);
    });
  })
  .catch((err: Error) => {
    debugLog('Server', '❌ MongoDB connection error', { error: err.message });
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  debugLog('Server', 'Error occurred', { 
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  });
  
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  debugLog('Server', '404 Not Found', { 
    url: req.originalUrl,
    method: req.method 
  });
  
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  debugLog('Server', 'SIGTERM received, shutting down gracefully');
  server.close(() => {
    debugLog('Server', 'HTTP server closed');
    mongoose.connection.close(() => {
      debugLog('Server', 'MongoDB connection closed');
      // eslint-disable-next-line no-process-exit
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  debugLog('Server', 'SIGINT received, shutting down gracefully');
  server.close(() => {
    debugLog('Server', 'HTTP server closed');
    mongoose.connection.close(() => {
      debugLog('Server', 'MongoDB connection closed');
      // eslint-disable-next-line no-process-exit
      process.exit(0);
    });
  });
});
