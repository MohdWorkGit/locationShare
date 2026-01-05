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
      const { name, color, icon } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Name is required' });
      }

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

      const userId = uuidv4();
      room.addUser(userId, { name, color, icon });
      userRooms.set(userId, roomCode);

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
  }
};

module.exports = { roomController, rooms, userRooms };
