const Room = require('../models/Room');
const multer = require('multer');
const { parseGPX, isValidGPX } = require('../utils/gpxParser');

// In-memory storage (shared with roomController)
const rooms = require('./roomController').rooms;

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/gpx+xml' ||
        file.mimetype === 'application/xml' ||
        file.mimetype === 'text/xml' ||
        file.originalname.toLowerCase().endsWith('.gpx')) {
      cb(null, true);
    } else {
      cb(new Error('Only GPX files are allowed'));
    }
  }
});

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

  // Get all rooms (both admin-created and user-created)
  getAdminRooms: (req, res) => {
    const allRooms = Array.from(rooms.values())
      .map(room => ({
        code: room.code,
        roomName: room.roomName,
        isPublic: room.isPublic,
        isAdminCreated: room.isAdminCreated,
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
      rooms: allRooms
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

    // Emit socket event to notify all users in the room
    if (req.io) {
      req.io.to(roomCode).emit('leader-role-updated', {
        userId: userId,
        isLeader: true,
        userName: userName
      });
    }

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

    // Emit socket event to notify all users in the room
    const user = room.getUser(userId);
    if (req.io && user) {
      req.io.to(roomCode).emit('leader-role-updated', {
        userId: userId,
        isLeader: false,
        userName: user.name
      });
    }

    res.json({
      success: true,
      room: room.toJSON()
    });
  },

  // Remove a user completely from a room
  removeUser: (req, res) => {
    const { roomCode, userId } = req.params;

    const room = rooms.get(roomCode);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    const user = room.getUser(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found in room'
      });
    }

    // Check if user is a leader
    if (user.isLeader && room.leaderIds.size === 1) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove the last leader. Assign another leader first.'
      });
    }

    // Remove user from room
    room.users.delete(userId);
    room.leaderIds.delete(userId);
    room.locations.delete(userId);
    room.locationHistory.delete(userId);
    room.destinations.delete(userId);

    // Emit socket event to notify all users in the room
    if (req.io) {
      req.io.to(roomCode).emit('user-left', {
        userId: userId,
        userName: user.name
      });
    }

    res.json({
      success: true,
      message: 'User removed from room',
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

    // Notify all users in the room that it's being deleted
    if (req.io) {
      req.io.to(roomCode).emit('room-deleted', {
        roomCode,
        message: 'This room has been deleted by an administrator'
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
  },

  // Upload GPX file to replace destination path
  uploadGPX: (req, res) => {
    const { roomCode } = req.params;

    const room = rooms.get(roomCode);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No GPX file uploaded'
      });
    }

    try {
      // Parse GPX file
      const gpxContent = req.file.buffer.toString('utf-8');

      // Validate GPX
      if (!isValidGPX(gpxContent)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid GPX file format'
        });
      }

      // Extract coordinates
      const coordinates = parseGPX(gpxContent);

      if (coordinates.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid coordinates found in GPX file'
        });
      }

      // Clear existing destination path
      room.clearDestinationPath();

      // Add new destinations from GPX
      const now = new Date();
      coordinates.forEach((coord, index) => {
        const destination = {
          lat: coord.lat,
          lng: coord.lng,
          note: `Point ${index + 1}`,
          color: '#2196F3', // Default blue color
          size: 30, // Default small size
          addedAt: now,
          order: index,
          updatedAt: now
        };
        room.addDestinationToPath(destination);
      });

      // Emit socket event to notify all users in the room
      if (req.io) {
        req.io.to(roomCode).emit('destination-path-updated', {
          roomCode: roomCode,
          destinationPath: room.getDestinationPath(),
          currentDestinationIndex: room.currentDestinationIndex
        });
      }

      res.json({
        success: true,
        message: `Successfully imported ${coordinates.length} points from GPX file`,
        destinationPath: room.getDestinationPath(),
        pointCount: coordinates.length
      });
    } catch (error) {
      console.error('Error uploading GPX:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to process GPX file'
      });
    }
  }
};

// Export both controller and upload middleware
module.exports = adminController;
module.exports.upload = upload;
