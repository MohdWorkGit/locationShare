const { v4: uuidv4 } = require('uuid');
const Room = require('../models/Room');

// In-memory storage (use database in production)
const rooms = new Map();
const userRooms = new Map(); // Maps userId to roomCode

function generateRoomCode() {
  return Math.random().toString(36).substr(2, 6).toUpperCase();
}

const roomController = {
  // Create a new room
  createRoom: (req, res) => {
    try {
      const { name, color, icon, roomCode: requestedRoomCode } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Name is required' });
      }

      // Check if trying to reconnect to existing room
      if (requestedRoomCode) {
        const existingRoom = rooms.get(requestedRoomCode);
        if (existingRoom) {
          // Check if user with same name exists (leader reconnection)
          const existingUser = existingRoom.findUserByName(name);
          if (existingUser && existingUser.user.isLeader) {
            // Reconnect as leader
            existingRoom.reconnectUser(existingUser.userId);
            userRooms.set(existingUser.userId, requestedRoomCode);

            return res.status(200).json({
              success: true,
              reconnected: true,
              room: existingRoom.toJSON(),
              userId: existingUser.userId
            });
          }
        }
      }

      // Create new room
      const roomCode = generateRoomCode();
      const leaderId = uuidv4();

      const room = new Room(roomCode, leaderId, { name, color, icon });
      rooms.set(roomCode, room);
      userRooms.set(leaderId, roomCode);

      res.status(201).json({
        success: true,
        room: room.toJSON(),
        userId: leaderId
      });
    } catch (error) {
      console.error('Error creating room:', error);
      res.status(500).json({ error: 'Failed to create room' });
    }
  },

  // Join an existing room
  joinRoom: (req, res) => {
    try {
      const { roomCode } = req.params;
      const { name, color, icon } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Name is required' });
      }

      const room = rooms.get(roomCode);
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }

      // Check if user with same name already exists (reconnection)
      const existingUser = room.findUserByName(name);
      if (existingUser) {
        // Reconnect existing user
        room.reconnectUser(existingUser.userId);
        userRooms.set(existingUser.userId, roomCode);

        return res.status(200).json({
          success: true,
          reconnected: true,
          room: room.toJSON(),
          userId: existingUser.userId
        });
      }

      // Add new user
      const userId = uuidv4();
      room.addUser(userId, { name, color, icon });
      userRooms.set(userId, roomCode);

      // If this is an admin-created room with no leaders, make first user a leader
      if (room.isAdminCreated && room.getLeaderIds().length === 0) {
        room.addLeader(userId);
      }

      res.status(200).json({
        success: true,
        room: room.toJSON(),
        userId: userId
      });
    } catch (error) {
      console.error('Error joining room:', error);
      res.status(500).json({ error: 'Failed to join room' });
    }
  },

  // Get room details
  getRoom: (req, res) => {
    try {
      const { roomCode } = req.params;
      const room = rooms.get(roomCode);

      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }

      res.status(200).json({
        success: true,
        room: room.toJSON()
      });
    } catch (error) {
      console.error('Error getting room:', error);
      res.status(500).json({ error: 'Failed to get room' });
    }
  },

  // Leave room
  leaveRoom: (req, res) => {
    try {
      const { roomCode } = req.params;
      const { userId } = req.body;

      const room = rooms.get(roomCode);
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }

      room.removeUser(userId);
      userRooms.delete(userId);

      // Delete room if empty or leader left
      if (room.users.size === 0 || userId === room.leaderId) {
        rooms.delete(roomCode);
      }

      res.status(200).json({
        success: true,
        message: 'Left room successfully'
      });
    } catch (error) {
      console.error('Error leaving room:', error);
      res.status(500).json({ error: 'Failed to leave room' });
    }
  },

  // Export destination path
  exportDestinationPath: (req, res) => {
    try {
      const { roomCode } = req.params;
      const { format = 'json' } = req.query;

      const room = rooms.get(roomCode);
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }

      const destinationPath = room.getDestinationPath();

      if (format === 'gpx') {
        // Export as GPX format
        const gpx = generateGPX(destinationPath, room.code);
        res.set('Content-Type', 'application/gpx+xml');
        res.set('Content-Disposition', `attachment; filename="route-${room.code}.gpx"`);
        res.send(gpx);
      } else if (format === 'csv') {
        // Export as CSV format
        const csv = generateCSV(destinationPath);
        res.set('Content-Type', 'text/csv');
        res.set('Content-Disposition', `attachment; filename="route-${room.code}.csv"`);
        res.send(csv);
      } else {
        // Default: JSON format
        res.status(200).json({
          success: true,
          roomCode: room.code,
          destinationPath: destinationPath,
          totalDestinations: destinationPath.length,
          exportedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error exporting destination path:', error);
      res.status(500).json({ error: 'Failed to export destination path' });
    }
  }
};

// Helper function to generate GPX format
function generateGPX(destinations, roomCode) {
  const header = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="LocationTracker" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>Route ${roomCode}</name>
    <time>${new Date().toISOString()}</time>
  </metadata>
  <rte>
    <name>Destination Route</name>`;

  const waypoints = destinations.map((dest, index) => `
    <rtept lat="${dest.lat}" lon="${dest.lng}">
      <name>Destination ${index + 1}</name>
      <time>${dest.addedAt}</time>
    </rtept>`).join('');

  const footer = `
  </rte>
</gpx>`;

  return header + waypoints + footer;
}

// Helper function to generate CSV format
function generateCSV(destinations) {
  const header = 'Order,Latitude,Longitude,Added At\n';
  const rows = destinations.map((dest, index) =>
    `${index + 1},${dest.lat},${dest.lng},${dest.addedAt}`
  ).join('\n');
  return header + rows;
}

module.exports = { roomController, rooms, userRooms };
