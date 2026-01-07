const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

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

// Public endpoint for users to see available rooms
router.get('/public-rooms', adminController.getPublicRooms);

module.exports = router;
