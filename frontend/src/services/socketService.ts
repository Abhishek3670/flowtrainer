// src/services/socketService.ts
import { io, Socket } from 'socket.io-client';

class SocketService {
  socket: Socket | null = null;

  connect(token: string) {
    this.socket = io(process.env.REACT_APP_WS_URL!, {
      auth: { token },
    });
  }
  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }
  isConnected() {
    return this.socket?.connected ?? false;
  }
}

export const socketService = new SocketService();
