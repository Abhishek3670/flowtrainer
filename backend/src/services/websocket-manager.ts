// backend/src/services/websocket-manager.ts
import { Server as SocketServer } from 'socket.io';
import { Server } from 'http';
import { EventEmitter } from 'events';

interface WebSocketMetrics {
  activeConnections: number;
  totalConnections: number;
  messagesPerSecond: number;
  averageLatency: number;
  errorRate: number;
}

interface ConnectionPool {
  [userId: string]: {
    socket: any;
    lastActivity: number;
    connectionTime: number;
    messageCount: number;
  };
}

export class WebSocketManager extends EventEmitter {
  private io: SocketServer;
  private connectionPool: ConnectionPool = {};
  private metrics: WebSocketMetrics = {
    activeConnections: 0,
    totalConnections: 0,
    messagesPerSecond: 0,
    averageLatency: 0,
    errorRate: 0
  };
  private performanceMonitor: NodeJS.Timeout | null = null;

  constructor(server: Server) {
    super();
    this.io = new SocketServer(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || "http://localhost:3000",
        methods: ["GET", "POST"]
      },
      // Performance optimizations
      pingTimeout: 60000,
      pingInterval: 25000,
      maxHttpBufferSize: 1e6, // 1MB
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
    this.startPerformanceMonitoring();
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      const userId = socket.handshake.auth?.userId || socket.id;
      const connectionTime = Date.now();

      // Add to connection pool
      this.connectionPool[userId] = {
        socket,
        lastActivity: connectionTime,
        connectionTime,
        messageCount: 0
      };

      this.metrics.activeConnections++;
      this.metrics.totalConnections++;

      console.log(`✅ WebSocket connected: ${userId} (Active: ${this.metrics.activeConnections})`);

      // Performance monitoring for this connection
      socket.on('performance-request', () => {
        this.sendPerformanceMetrics(socket);
      });

      // Real-time performance streaming
      socket.on('subscribe-performance', () => {
        socket.join('performance-subscribers');
        this.sendPerformanceMetrics(socket);
      });

      socket.on('unsubscribe-performance', () => {
        socket.leave('performance-subscribers');
      });

      // Connection activity tracking
      socket.onAny(() => {
        if (this.connectionPool[userId]) {
          this.connectionPool[userId].lastActivity = Date.now();
          this.connectionPool[userId].messageCount++;
        }
      });

      // Disconnect handling
      socket.on('disconnect', (reason) => {
        console.log(`❌ WebSocket disconnected: ${userId} (Reason: ${reason})`);
        delete this.connectionPool[userId];
        this.metrics.activeConnections--;
      });

      // Error handling
      socket.on('error', (error) => {
        console.error(`🚨 WebSocket error for ${userId}:`, error);
        this.metrics.errorRate++;
      });
    });
  }

  private startPerformanceMonitoring(): void {
    this.performanceMonitor = setInterval(() => {
      this.updateMetrics();
      this.broadcastPerformanceMetrics();
      this.cleanupInactiveConnections();
    }, 5000); // Every 5 seconds
  }

  private updateMetrics(): void {
    const now = Date.now();
    let totalMessages = 0;
    let totalLatency = 0;
    let activeCount = 0;

    // Calculate metrics from connection pool
    Object.values(this.connectionPool).forEach(conn => {
      totalMessages += conn.messageCount;
      totalLatency += (now - conn.lastActivity);
      if (now - conn.lastActivity < 30000) { // Active in last 30s
        activeCount++;
      }
    });

    this.metrics.messagesPerSecond = totalMessages / 5; // Per 5-second interval
    this.metrics.averageLatency = activeCount > 0 ? totalLatency / activeCount : 0;
    this.metrics.activeConnections = Object.keys(this.connectionPool).length;

    // Reset message counts
    Object.values(this.connectionPool).forEach(conn => {
      conn.messageCount = 0;
    });
  }

  private sendPerformanceMetrics(socket: any): void {
    const metrics = {
      ...this.metrics,
      timestamp: Date.now(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      connectionPoolSize: Object.keys(this.connectionPool).length
    };

    socket.emit('performance-metrics', metrics);
  }

  private broadcastPerformanceMetrics(): void {
    const metrics = {
      ...this.metrics,
      timestamp: Date.now(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      connectionPoolSize: Object.keys(this.connectionPool).length
    };

    this.io.to('performance-subscribers').emit('performance-update', metrics);
  }

  private cleanupInactiveConnections(): void {
    const now = Date.now();
    const inactiveTimeout = 5 * 60 * 1000; // 5 minutes

    Object.entries(this.connectionPool).forEach(([userId, conn]) => {
      if (now - conn.lastActivity > inactiveTimeout) {
        console.log(`🧹 Cleaning up inactive connection: ${userId}`);
        conn.socket.disconnect(true);
        delete this.connectionPool[userId];
      }
    });
  }

  // Public methods for external use
  public broadcastToAll(event: string, data: any): void {
    this.io.emit(event, data);
  }

  public sendToUser(userId: string, event: string, data: any): void {
    const connection = this.connectionPool[userId];
    if (connection) {
      connection.socket.emit(event, data);
    }
  }

  public getMetrics(): WebSocketMetrics & { connectionPoolSize: number } {
    return {
      ...this.metrics,
      connectionPoolSize: Object.keys(this.connectionPool).length
    };
  }

  public getConnectionInfo(): { [userId: string]: any } {
    const info: { [userId: string]: any } = {};
    
    Object.entries(this.connectionPool).forEach(([userId, conn]) => {
      info[userId] = {
        connected: conn.socket.connected,
        lastActivity: new Date(conn.lastActivity).toISOString(),
        connectionTime: new Date(conn.connectionTime).toISOString(),
        totalMessages: conn.messageCount,
        uptime: Date.now() - conn.connectionTime
      };
    });

    return info;
  }

  public shutdown(): void {
    console.log('🔄 Shutting down WebSocket manager...');
    
    if (this.performanceMonitor) {
      clearInterval(this.performanceMonitor);
    }

    // Disconnect all sockets gracefully
    this.io.disconnectSockets(true);
    
    console.log('✅ WebSocket manager shutdown complete');
  }
}

export default WebSocketManager;