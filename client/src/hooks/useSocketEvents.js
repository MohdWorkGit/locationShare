import { useEffect } from 'react'
import {
  joinSocketRoom,
  onRoomState,
  onUserJoined,
  onUserLeft,
  onLocationUpdated,
  onDestinationSet,
  onDestinationAssigned,
  onDestinationRemoved,
  onLocationHistory,
  onDestinationPathUpdated,
  onCurrentDestinationUpdated,
  onLeaderRoleUpdated
} from '../services/socketService'

export function useSocketEvents(roomCode, userId, members, setMembers, setDestinationPath, setCurrentDestinationIndex, showNotification) {
  useEffect(() => {
    // Join the room
    joinSocketRoom(roomCode, userId)

    // Handle room state updates
    const handleRoomState = (data) => {
      console.log('Room state received:', data)
      const updatedMembers = {}
      data.room.users.forEach(user => {
        updatedMembers[user.id] = {
          ...user,
          location: user.location || null,
          destination: user.destination || null,
          lastSeen: new Date()
        }
      })
      setMembers(updatedMembers)
    }

    // Handle user joined
    const handleUserJoined = (data) => {
      console.log('User joined:', data)
      if (data.user && data.userId) {
        setMembers(prev => ({
          ...prev,
          [data.userId]: {
            id: data.userId,
            name: data.user.name,
            color: data.user.color,
            icon: data.user.icon,
            isLeader: false,
            location: null,
            destination: null,
            lastSeen: new Date()
          }
        }))
        showNotification(`${data.user.name} joined the room!`, 'success')
      }
    }

    // Handle user left
    const handleUserLeft = (data) => {
      console.log('User left:', data)
      if (members[data.userId]) {
        const userName = members[data.userId].name
        setMembers(prev => {
          const updated = { ...prev }
          delete updated[data.userId]
          return updated
        })
        showNotification(`${userName} left the room`, 'info')
      }
    }

    // Handle location updates
    const handleLocationUpdated = (data) => {
      console.log('Location updated:', data)
      if (data.userId && data.location) {
        setMembers(prev => ({
          ...prev,
          [data.userId]: {
            ...prev[data.userId],
            location: data.location,
            lastSeen: new Date()
          }
        }))
      }
    }

    // Handle destination set
    const handleDestinationSet = (data) => {
      console.log('Destination set:', data)
      if (data.targetUserId && data.destination) {
        setMembers(prev => ({
          ...prev,
          [data.targetUserId]: {
            ...prev[data.targetUserId],
            destination: data.destination
          }
        }))
        if (members[data.targetUserId]) {
          showNotification(`Destination set for ${members[data.targetUserId].name}`, 'success')
        }
      }
    }

    // Handle destination assigned to current user
    const handleDestinationAssigned = (data) => {
      console.log('Destination assigned:', data)
      showNotification(`📍 ${data.message}`, 'success')
    }

    // Handle destination removed
    const handleDestinationRemoved = (data) => {
      console.log('Destination removed:', data)
      if (data.targetUserId) {
        setMembers(prev => ({
          ...prev,
          [data.targetUserId]: {
            ...prev[data.targetUserId],
            destination: null
          }
        }))
        if (members[data.targetUserId]) {
          showNotification(`Destination removed for ${members[data.targetUserId].name}`, 'info')
        }
      }
    }

    // Handle location history
    const handleLocationHistory = (data) => {
      console.log('Location history received:', data)
      if (data.userId && data.locations && data.locations.length > 0) {
        setMembers(prev => ({
          ...prev,
          [data.userId]: {
            ...prev[data.userId],
            path: data.locations
          }
        }))
      }
    }

    // Handle destination path updated
    const handleDestinationPathUpdated = (data) => {
      console.log('Destination path updated:', data)
      if (data.destinationPath !== undefined) {
        setDestinationPath(data.destinationPath)
      }
      if (data.currentDestinationIndex !== undefined) {
        setCurrentDestinationIndex(data.currentDestinationIndex)
      }
      if (data.message) {
        showNotification(data.message, 'info')
      }
    }

    // Handle current destination updated
    const handleCurrentDestinationUpdated = (data) => {
      console.log('Current destination updated:', data)
      if (data.currentDestinationIndex !== undefined) {
        setCurrentDestinationIndex(data.currentDestinationIndex)
      }
      if (data.message) {
        showNotification(data.message, 'info')
      }
    }

    // Handle leader role updated
    const handleLeaderRoleUpdated = (data) => {
      console.log('Leader role updated:', data)
      const { userId: targetUserId, isLeader, userName } = data
      if (targetUserId && members[targetUserId]) {
        setMembers(prev => ({
          ...prev,
          [targetUserId]: {
            ...prev[targetUserId],
            isLeader: isLeader
          }
        }))
        const roleText = isLeader ? 'promoted to Leader' : 'changed to Member'
        showNotification(`${userName} ${roleText} 👑`, 'info')
      }
    }

    // Register event listeners
    onRoomState(handleRoomState)
    onUserJoined(handleUserJoined)
    onUserLeft(handleUserLeft)
    onLocationUpdated(handleLocationUpdated)
    onDestinationSet(handleDestinationSet)
    onDestinationAssigned(handleDestinationAssigned)
    onDestinationRemoved(handleDestinationRemoved)
    onLocationHistory(handleLocationHistory)
    onDestinationPathUpdated(handleDestinationPathUpdated)
    onCurrentDestinationUpdated(handleCurrentDestinationUpdated)
    onLeaderRoleUpdated(handleLeaderRoleUpdated)

    // Cleanup function
    return () => {
      // Socket.IO listeners are automatically cleaned up when socket disconnects
    }
  }, [roomCode, userId])
}
