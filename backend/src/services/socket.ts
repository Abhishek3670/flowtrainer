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

  // Handle new object additions
  socket.on('add_object', (object) => {
    socket.broadcast.emit('object_added', object);
  });

  // Handle object updates
  socket.on('update_object', (object) => {
    socket.broadcast.emit('object_updated', object);
  });

  // Handle object removals
  socket.on('remove_object', (objectId) => {
    socket.broadcast.emit('object_removed', objectId);
  });

  // Handle cursor positions
  socket.on('cursor_position', (positionData) => {
    socket.broadcast.emit('cursor_moved', positionData);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.data.userId}`);
  });
};

