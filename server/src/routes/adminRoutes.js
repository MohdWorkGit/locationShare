const express = require('express');
const adminController = require('../controllers/adminController');

// Export a function that takes io instance
function createAdminRoutes(io) {
  const router = express.Router();

  // Store io instance for controller to use
  router.use((req, res, next) => {
    req.io = io;
    next();
  });

  // Create admin room
  router.post('/rooms', adminController.createAdminRoom);

  // Get all admin rooms
  router.get('/rooms', adminController.getAdminRooms);

  // Get room details
  router.get('/rooms/:roomCode', adminController.getRoomDetails);

  // Update room settings
  router.put('/rooms/:roomCode', adminController.updateRoom);

  // Delete admin room
  router.delete('/rooms/:roomCode', adminController.deleteAdminRoom);

  // Assign leader to room
  router.post('/rooms/:roomCode/leaders', adminController.assignLeader);

  // Remove leader from room
  router.delete('/rooms/:roomCode/leaders/:userId', adminController.removeLeader);

  // Remove user from room completely
  router.delete('/rooms/:roomCode/users/:userId', adminController.removeUser);

  // Public endpoint for users to see available rooms
  router.get('/public-rooms', adminController.getPublicRooms);

  return router;
}

module.exports = createAdminRoutes;
