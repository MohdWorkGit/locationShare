import { io } from 'socket.io-client'

const SOCKET_URL = 'http://localhost:5000'
let socket = null

export const initializeSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling']
    })

    socket.on('connect', () => {
      console.log('Connected to server:', socket.id)
    })

    socket.on('disconnect', () => {
      console.log('Disconnected from server')
    })

    socket.on('error', (error) => {
      console.error('Socket error:', error)
    })
  }

  return socket
}

export const getSocket = () => {
  if (!socket) {
    return initializeSocket()
  }
  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export const joinSocketRoom = (roomCode, userId) => {
  const s = getSocket()
  s.emit('join-room', { roomCode, userId })
}

export const updateLocation = (userId, location) => {
  const s = getSocket()
  s.emit('location-update', { userId, location })
}

export const setDestination = (targetUserId, destination) => {
  const s = getSocket()
  s.emit('set-destination', { targetUserId, destination })
}

export const removeDestination = (targetUserId) => {
  const s = getSocket()
  s.emit('remove-destination', { targetUserId })
}

export const getLocationHistory = (userId, timeRange = 3600000) => {
  const s = getSocket()
  s.emit('get-location-history', { userId, timeRange })
}

export const onRoomState = (callback) => {
  const s = getSocket()
  s.on('room-state', callback)
}

export const onUserJoined = (callback) => {
  const s = getSocket()
  s.on('user-joined', callback)
}

export const onUserLeft = (callback) => {
  const s = getSocket()
  s.on('user-left', callback)
}

export const onLocationUpdated = (callback) => {
  const s = getSocket()
  s.on('location-updated', callback)
}

export const onDestinationSet = (callback) => {
  const s = getSocket()
  s.on('destination-set', callback)
}

export const onDestinationAssigned = (callback) => {
  const s = getSocket()
  s.on('destination-assigned', callback)
}

export const onDestinationRemoved = (callback) => {
  const s = getSocket()
  s.on('destination-removed', callback)
}

export const onLocationHistory = (callback) => {
  const s = getSocket()
  s.on('location-history', callback)
}

export default {
  initializeSocket,
  getSocket,
  disconnectSocket,
  joinSocketRoom,
  updateLocation,
  setDestination,
  removeDestination,
  getLocationHistory,
  onRoomState,
  onUserJoined,
  onUserLeft,
  onLocationUpdated,
  onDestinationSet,
  onDestinationAssigned,
  onDestinationRemoved,
  onLocationHistory
}
