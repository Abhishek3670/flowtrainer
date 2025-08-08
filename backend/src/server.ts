import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

// Import routes (Note: using require for now since routes are in JS)
const workflowRoutes = require('./routes/workflowRoutes');

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, { 
  cors: { 
    origin: process.env.NODE_ENV === 'production' ? false : ["http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE"]
  } 
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/workflows', workflowRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'FlowCraft API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Socket.io for real-time collaboration
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-workflow', (workflowId: string) => {
    socket.join(`workflow-${workflowId}`);
    socket.to(`workflow-${workflowId}`).emit('user-joined', socket.id);
  });
  
  socket.on('workflow-update', (data: any) => {
    socket.to(`workflow-${data.workflowId}`).emit('workflow-update', {
      ...data,
      userId: socket.id
    });
  });
  
  socket.on('canvas-update', (data: any) => {
    socket.broadcast.emit('canvas-update', data);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Database connection
const MONGO_URI: string = process.env.MONGO_URI || 'mongodb://localhost:27017/flowcraft';
const PORT: number = parseInt(process.env.PORT || '4000', 10);

console.log('Attempting to connect to MongoDB with URI:', MONGO_URI);

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB successfully');
    server.listen(PORT, () => {
      console.log(`🚀 FlowCraft backend listening on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📁 Workflow API: http://localhost:${PORT}/api/workflows`);
    });
  })
  .catch((err: Error) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use('*', (req: express.Request, res: express.Response) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

export default app;
