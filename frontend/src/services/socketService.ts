import { io, Socket } from 'socket.io-client';
import { WorkflowUpdate, UserCursor } from '../types';

class SocketService {
  private socket: Socket | null = null;
  private connected = false;

  connect(token: string): void {
    const WS_URL = process.env.REACT_APP_WS_URL || 'http://localhost:5000';
    
    this.socket = io(WS_URL, {
      auth: {
        token,
      },
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.connected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  // Emit events
  emitWorkflowUpdate(update: WorkflowUpdate): void {
    if (this.socket && this.connected) {
      this.socket.emit('workflow_update', update);
    }
  }

  emitCursorPosition(cursor: UserCursor): void {
    if (this.socket && this.connected) {
      this.socket.emit('cursor_position', cursor);
    }
  }

  // Listen to events
  onWorkflowUpdate(callback: (update: WorkflowUpdate) => void): void {
    if (this.socket) {
      this.socket.on('update_workflow', callback);
    }
  }

  onUserCursor(callback: (cursor: UserCursor) => void): void {
    if (this.socket) {
      this.socket.on('user_cursor', callback);
    }
  }

  // Remove listeners
  removeAllListeners(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }
}

export const socketService = new SocketService();
