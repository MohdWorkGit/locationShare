const Room = require('../models/Room');

// In-memory storage (shared with roomController)
const rooms = require('./roomController').rooms;

const adminController = {
  // Create a new admin room
  createAdminRoom: (req, res) => {
    const { roomName, isPublic = true } = req.body;

    // Generate room code
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Create admin room without initial leader
    const adminId = 'admin-' + Date.now();
    const room = new Room(roomCode, adminId, {
      name: 'Admin',
      color: '#667eea',
      icon: '👑'
    }, {
      isAdminCreated: true,
      isPublic,
      roomName: roomName || `Room ${roomCode}`
    });

    // Remove the admin user (we only need the room structure)
    room.users.delete(adminId);
    room.leaderIds.clear();

    rooms.set(roomCode, room);

    res.status(201).json({
      success: true,
      room: {
        code: roomCode,
        roomName: room.roomName,
        isPublic: room.isPublic,
        leaderIds: room.getLeaderIds(),
        createdAt: room.createdAt
      }
    });
  },

  // Get all admin rooms
  getAdminRooms: (req, res) => {
    const adminRooms = Array.from(rooms.values())
      .filter(room => room.isAdminCreated)
      .map(room => ({
        code: room.code,
        roomName: room.roomName,
        isPublic: room.isPublic,
        leaderIds: room.getLeaderIds(),
        userCount: room.getAllUsers().length,
        onlineCount: room.getOnlineUsersCount(),
        createdAt: room.createdAt,
        users: room.getAllUsers().map(u => ({
          id: u.id,
          name: u.name,
          isLeader: u.isLeader,
          online: u.online
        }))
      }));

    res.json({
      success: true,
      rooms: adminRooms
    });
  },

  // Get public rooms (for user selection)
  getPublicRooms: (req, res) => {
    const publicRooms = Array.from(rooms.values())
      .filter(room => room.isPublic && room.isAdminCreated)
      .map(room => ({
        code: room.code,
        roomName: room.roomName,
        userCount: room.getAllUsers().length,
        onlineCount: room.getOnlineUsersCount(),
        createdAt: room.createdAt
      }));

    res.json({
      success: true,
      rooms: publicRooms
    });
  },

  // Assign a leader to a room
  assignLeader: (req, res) => {
    const { roomCode } = req.params;
    const { userId, userName, color, icon } = req.body;

    const room = rooms.get(roomCode);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Add user if not exists
    if (!room.getUser(userId)) {
      room.addUser(userId, {
        name: userName,
        color: color || '#667eea',
        icon: icon || '👤'
      });
    }

    // Make user a leader
    room.addLeader(userId);

    res.json({
      success: true,
      room: room.toJSON()
    });
  },

  // Remove a leader from a room
  removeLeader: (req, res) => {
    const { roomCode, userId } = req.params;

    const room = rooms.get(roomCode);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    const removed = room.removeLeader(userId);
    if (!removed) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove last leader'
      });
    }

    res.json({
      success: true,
      room: room.toJSON()
    });
  },

  // Delete an admin room
  deleteAdminRoom: (req, res) => {
    const { roomCode } = req.params;

    const room = rooms.get(roomCode);
    if (!room || !room.isAdminCreated) {
      return res.status(404).json({
        success: false,
        message: 'Admin room not found'
      });
    }

    rooms.delete(roomCode);

    res.json({
      success: true,
      message: 'Room deleted successfully'
    });
  },

  // Get room details with map data
  getRoomDetails: (req, res) => {
    const { roomCode } = req.params;

    const room = rooms.get(roomCode);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    res.json({
      success: true,
      room: room.toJSON()
    });
  },

  // Update room settings
  updateRoom: (req, res) => {
    const { roomCode } = req.params;
    const { roomName, isPublic } = req.body;

    const room = rooms.get(roomCode);
    if (!room || !room.isAdminCreated) {
      return res.status(404).json({
        success: false,
        message: 'Admin room not found'
      });
    }

    if (roomName !== undefined) room.roomName = roomName;
    if (isPublic !== undefined) room.isPublic = isPublic;

    res.json({
      success: true,
      room: {
        code: room.code,
        roomName: room.roomName,
        isPublic: room.isPublic
      }
    });
  }
};

module.exports = adminController;
