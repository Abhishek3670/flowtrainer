// backend/src/middleware/websocket-performance.ts
import { WebSocketManager } from '../services/websocket-manager';

export class WebSocketPerformanceMiddleware {
  private wsManager: WebSocketManager;

  constructor(wsManager: WebSocketManager) {
    this.wsManager = wsManager;
  }

  // Middleware to track WebSocket performance
  public trackPerformance() {
    return (socket: any, next: any) => {
      const startTime = Date.now();

      // Track connection time
      socket.on('disconnect', () => {
        const connectionDuration = Date.now() - startTime;
        console.log(`📊 WebSocket connection duration: ${connectionDuration}ms`);
      });

      // Track message latency
      socket.onAny((event: string, ...args: any[]) => {
        const messageTime = Date.now();
        socket.emit(`${event}-ack`, { receivedAt: messageTime });
      });

      next();
    };
  }

  // Rate limiting for WebSocket messages
  public rateLimiting(maxMessagesPerMinute: number = 60) {
    const messageCounts = new Map<string, { count: number; resetTime: number }>();

    return (socket: any, next: any) => {
      const userId = socket.handshake.auth?.userId || socket.id;
      const now = Date.now();
      
      socket.use((packet: any, next: any) => {
        const userLimit = messageCounts.get(userId) || { count: 0, resetTime: now + 60000 };
        
        // Reset counter if time window passed
        if (now > userLimit.resetTime) {
          userLimit.count = 0;
          userLimit.resetTime = now + 60000;
        }

        // Check rate limit
        if (userLimit.count >= maxMessagesPerMinute) {
          return next(new Error('Rate limit exceeded'));
        }

        userLimit.count++;
        messageCounts.set(userId, userLimit);
        next();
      });

      next();
    };
  }
}