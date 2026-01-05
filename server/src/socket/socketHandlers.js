const { rooms, userRooms } = require('../controllers/roomController');

function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join room
    socket.on('join-room', (data) => {
      try {
        const { roomCode, userId } = data;
        const room = rooms.get(roomCode);

        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        // Join socket room
        socket.join(roomCode);
        socket.userId = userId;
        socket.roomCode = roomCode;

        // Send current room state to the user
        socket.emit('room-state', { room: room.toJSON() });

        // Notify others in the room
        const user = room.getUser(userId);
        if (user && !user.isLeader) {
          socket.to(roomCode).emit('user-joined', {
            userId: userId,
            user: {
              name: user.name,
              color: user.color,
              icon: user.icon
            }
          });
        }

        console.log(`User ${userId} joined room ${roomCode}`);
      } catch (error) {
        console.error('Error joining room:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Update location
    socket.on('location-update', (data) => {
      try {
        const { userId, location } = data;
        const roomCode = userRooms.get(userId);

        if (!roomCode) {
          socket.emit('error', { message: 'User not in any room' });
          return;
        }

        const room = rooms.get(roomCode);
        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        // Update location in room
        room.updateLocation(userId, location);

        // Broadcast to all users in the room
        io.to(roomCode).emit('location-updated', {
          userId: userId,
          location: location
        });

        console.log(`Location updated for user ${userId} in room ${roomCode}`);
      } catch (error) {
        console.error('Error updating location:', error);
        socket.emit('error', { message: 'Failed to update location' });
      }
    });

    // Set destination (leader only)
    socket.on('set-destination', (data) => {
      try {
        const { targetUserId, destination } = data;
        const roomCode = socket.roomCode;
        const userId = socket.userId;

        if (!roomCode) {
          socket.emit('error', { message: 'Not in any room' });
          return;
        }

        const room = rooms.get(roomCode);
        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        // Check if user is leader
        if (userId !== room.leaderId) {
          socket.emit('error', { message: 'Only leader can set destinations' });
          return;
        }

        // Set destination
        room.setDestination(targetUserId, destination);

        // Notify all users in the room
        io.to(roomCode).emit('destination-set', {
          targetUserId: targetUserId,
          destination: destination
        });

        // Notify the target user specifically
        const targetUser = room.getUser(targetUserId);
        if (targetUser) {
          io.to(roomCode).emit('destination-assigned', {
            message: `Leader assigned you a destination`,
            destination: destination,
            targetUserId: targetUserId
          });
        }

        console.log(`Destination set for user ${targetUserId} in room ${roomCode}`);
      } catch (error) {
        console.error('Error setting destination:', error);
        socket.emit('error', { message: 'Failed to set destination' });
      }
    });

    // Remove destination (leader only)
    socket.on('remove-destination', (data) => {
      try {
        const { targetUserId } = data;
        const roomCode = socket.roomCode;
        const userId = socket.userId;

        if (!roomCode) {
          socket.emit('error', { message: 'Not in any room' });
          return;
        }

        const room = rooms.get(roomCode);
        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        // Check if user is leader
        if (userId !== room.leaderId) {
          socket.emit('error', { message: 'Only leader can remove destinations' });
          return;
        }

        // Remove destination
        room.removeDestination(targetUserId);

        // Notify all users in the room
        io.to(roomCode).emit('destination-removed', {
          targetUserId: targetUserId
        });

        console.log(`Destination removed for user ${targetUserId} in room ${roomCode}`);
      } catch (error) {
        console.error('Error removing destination:', error);
        socket.emit('error', { message: 'Failed to remove destination' });
      }
    });

    // Get location history
    socket.on('get-location-history', (data) => {
      try {
        const { userId, timeRange } = data;
        const roomCode = socket.roomCode;

        if (!roomCode) {
          socket.emit('error', { message: 'Not in any room' });
          return;
        }

        const room = rooms.get(roomCode);
        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        const history = room.getLocationHistory(userId, timeRange);

        socket.emit('location-history', {
          userId: userId,
          locations: history
        });

        console.log(`Location history sent for user ${userId}`);
      } catch (error) {
        console.error('Error getting location history:', error);
        socket.emit('error', { message: 'Failed to get location history' });
      }
    });

    // Add destination to global path (leader only)
    socket.on('add-destination-to-path', (data) => {
      try {
        const { destination } = data;
        const roomCode = socket.roomCode;
        const userId = socket.userId;

        if (!roomCode) {
          socket.emit('error', { message: 'Not in any room' });
          return;
        }

        const room = rooms.get(roomCode);
        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        // Check if user is leader
        if (userId !== room.leaderId) {
          socket.emit('error', { message: 'Only leader can add destinations to path' });
          return;
        }

        // Add destination to path
        const index = room.addDestinationToPath(destination);

        // Notify all users in the room
        io.to(roomCode).emit('destination-path-updated', {
          destinationPath: room.getDestinationPath(),
          currentDestinationIndex: room.currentDestinationIndex,
          message: `New destination added to path`
        });

        console.log(`Destination added to path in room ${roomCode}, index: ${index}`);
      } catch (error) {
        console.error('Error adding destination to path:', error);
        socket.emit('error', { message: 'Failed to add destination to path' });
      }
    });

    // Remove destination from path (leader only)
    socket.on('remove-destination-from-path', (data) => {
      try {
        const { index } = data;
        const roomCode = socket.roomCode;
        const userId = socket.userId;

        if (!roomCode) {
          socket.emit('error', { message: 'Not in any room' });
          return;
        }

        const room = rooms.get(roomCode);
        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        // Check if user is leader
        if (userId !== room.leaderId) {
          socket.emit('error', { message: 'Only leader can remove destinations from path' });
          return;
        }

        // Remove destination from path
        room.removeDestinationFromPath(index);

        // Notify all users in the room
        io.to(roomCode).emit('destination-path-updated', {
          destinationPath: room.getDestinationPath(),
          currentDestinationIndex: room.currentDestinationIndex,
          message: `Destination removed from path`
        });

        console.log(`Destination removed from path in room ${roomCode}, index: ${index}`);
      } catch (error) {
        console.error('Error removing destination from path:', error);
        socket.emit('error', { message: 'Failed to remove destination from path' });
      }
    });

    // Clear destination path (leader only)
    socket.on('clear-destination-path', (data) => {
      try {
        const roomCode = socket.roomCode;
        const userId = socket.userId;

        if (!roomCode) {
          socket.emit('error', { message: 'Not in any room' });
          return;
        }

        const room = rooms.get(roomCode);
        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        // Check if user is leader
        if (userId !== room.leaderId) {
          socket.emit('error', { message: 'Only leader can clear destination path' });
          return;
        }

        // Clear destination path
        room.clearDestinationPath();

        // Notify all users in the room
        io.to(roomCode).emit('destination-path-updated', {
          destinationPath: [],
          currentDestinationIndex: 0,
          message: `Destination path cleared`
        });

        console.log(`Destination path cleared in room ${roomCode}`);
      } catch (error) {
        console.error('Error clearing destination path:', error);
        socket.emit('error', { message: 'Failed to clear destination path' });
      }
    });

    // Set current destination index (leader only)
    socket.on('set-current-destination-index', (data) => {
      try {
        const { index } = data;
        const roomCode = socket.roomCode;
        const userId = socket.userId;

        if (!roomCode) {
          socket.emit('error', { message: 'Not in any room' });
          return;
        }

        const room = rooms.get(roomCode);
        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        // Check if user is leader
        if (userId !== room.leaderId) {
          socket.emit('error', { message: 'Only leader can set current destination' });
          return;
        }

        // Set current destination index
        room.setCurrentDestinationIndex(index);

        // Notify all users in the room
        io.to(roomCode).emit('current-destination-updated', {
          currentDestinationIndex: index,
          currentDestination: room.getCurrentDestination(),
          message: `Now navigating to destination ${index + 1}`
        });

        console.log(`Current destination set to index ${index} in room ${roomCode}`);
      } catch (error) {
        console.error('Error setting current destination:', error);
        socket.emit('error', { message: 'Failed to set current destination' });
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      try {
        const userId = socket.userId;
        const roomCode = socket.roomCode;

        if (userId && roomCode) {
          const room = rooms.get(roomCode);
          if (room) {
            const user = room.getUser(userId);

            // Notify others
            socket.to(roomCode).emit('user-left', { userId: userId });

            // Remove user from room
            room.removeUser(userId);
            userRooms.delete(userId);

            // Delete room if empty or leader left
            if (room.users.size === 0 || userId === room.leaderId) {
              rooms.delete(roomCode);
              console.log(`Room ${roomCode} deleted`);
            }

            console.log(`User ${userId} disconnected from room ${roomCode}`);
          }
        }

        console.log('User disconnected:', socket.id);
      } catch (error) {
        console.error('Error handling disconnect:', error);
      }
    });
  });
}

module.exports = setupSocketHandlers;
