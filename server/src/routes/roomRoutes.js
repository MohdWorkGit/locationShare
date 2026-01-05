const express = require('express');
const { roomController } = require('../controllers/roomController');

const router = express.Router();

// Room routes
router.post('/rooms', roomController.createRoom);
router.post('/rooms/:roomCode/join', roomController.joinRoom);
router.get('/rooms/:roomCode', roomController.getRoom);
router.post('/rooms/:roomCode/leave', roomController.leaveRoom);
router.get('/rooms/:roomCode/export', roomController.exportDestinationPath);

module.exports = router;
