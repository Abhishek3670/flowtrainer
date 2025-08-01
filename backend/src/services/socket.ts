import { Socket, Server } from 'socket.io';
import { WorkflowUpdate, UserCursor } from '../types';

/**
 * Handle socket connection events.
 */
export const handleSocketConnection = (socket: Socket, io: Server) => {
  // Broadcast user cursor position
  socket.on('cursor_position', (userCursor: UserCursor) => {
    socket.broadcast.emit('user_cursor', userCursor);
  });

  // Broadcast workflow updates to other clients
  socket.on('workflow_update', (update: WorkflowUpdate) => {
    socket.broadcast.emit('update_workflow', update);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.data.userId}`);
  });
};

