import { io } from 'socket.io-client'

// Use environment variable or undefined for same-origin connection (nginx proxy)
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || undefined
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

// Destination path functions
export const addDestinationToPath = (destination) => {
  const s = getSocket()
  s.emit('add-destination-to-path', { destination })
}

export const updateDestinationInPath = (index, updates) => {
  const s = getSocket()
  s.emit('update-destination-in-path', { index, updates })
}

export const removeDestinationFromPath = (index) => {
  const s = getSocket()
  s.emit('remove-destination-from-path', { index })
}

export const clearDestinationPath = () => {
  const s = getSocket()
  s.emit('clear-destination-path', {})
}

export const setCurrentDestinationIndex = (index) => {
  const s = getSocket()
  s.emit('set-current-destination-index', { index })
}

export const onDestinationPathUpdated = (callback) => {
  const s = getSocket()
  s.on('destination-path-updated', callback)
}

export const onCurrentDestinationUpdated = (callback) => {
  const s = getSocket()
  s.on('current-destination-updated', callback)
}

export const onLeaderRoleUpdated = (callback) => {
  const s = getSocket()
  s.on('leader-role-updated', callback)
}

export const onRoomDeleted = (callback) => {
  const s = getSocket()
  s.on('room-deleted', callback)
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
  onLocationHistory,
  addDestinationToPath,
  updateDestinationInPath,
  removeDestinationFromPath,
  clearDestinationPath,
  setCurrentDestinationIndex,
  onDestinationPathUpdated,
  onCurrentDestinationUpdated,
  onLeaderRoleUpdated,
  onRoomDeleted
}
