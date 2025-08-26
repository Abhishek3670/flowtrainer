// frontend/src/services/websocket-client.ts
import { io, Socket } from 'socket.io-client';

interface PerformanceMetrics {
  activeConnections: number;
  totalConnections: number;
  messagesPerSecond: number;
  averageLatency: number;
  errorRate: number;
  timestamp: number;
  memory: any;
  connectionPoolSize: number;
}

export class WebSocketClient {
  private socket: Socket | null = null;
  private performanceCallback: ((metrics: PerformanceMetrics) => void) | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(private url: string = 'http://localhost:4000') {}

  public connect(userId?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(this.url, {
        auth: { userId },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000
      });

      this.socket.on('connect', () => {
        console.log('✅ WebSocket connected');
        this.reconnectAttempts = 0;
        resolve();
      });

      this.socket.on('disconnect', (reason) => {
        console.log(`❌ WebSocket disconnected: ${reason}`);
      });

      this.socket.on('reconnect_attempt', (attempt) => {
        console.log(`🔄 WebSocket reconnection attempt: ${attempt}`);
        this.reconnectAttempts = attempt;
      });

      this.socket.on('connect_error', (error) => {
        console.error('🚨 WebSocket connection error:', error);
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          reject(error);
        }
      });

      // Performance monitoring
      this.socket.on('performance-update', (metrics: PerformanceMetrics) => {
        if (this.performanceCallback) {
          this.performanceCallback(metrics);
        }
      });

      this.socket.on('performance-broadcast', (metrics: PerformanceMetrics) => {
        console.log('📊 Performance broadcast received:', metrics);
      });
    });
  }

  public subscribeToPerformance(callback: (metrics: PerformanceMetrics) => void): void {
    this.performanceCallback = callback;
    this.socket?.emit('subscribe-performance');
  }

  public unsubscribeFromPerformance(): void {
    this.performanceCallback = null;
    this.socket?.emit('unsubscribe-performance');
  }

  public requestPerformanceData(): void {
    this.socket?.emit('performance-request');
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export default WebSocketClient;