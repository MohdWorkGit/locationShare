import { useState, useEffect } from 'react'
import MapView from './MapView'
import MemberList from './MemberList'
import LeaderControls from './LeaderControls'
import Notification from './Notification'
import { useLocationTracking } from '../hooks/useLocationTracking'
import { useSocketEvents } from '../hooks/useSocketEvents'
import { leaveRoom } from '../services/api'

function RoomInterface({ room, user, isLeader, onLeaveRoom }) {
  const [members, setMembers] = useState({})
  const [pathsVisible, setPathsVisible] = useState(false)
  const [notification, setNotification] = useState(null)
  const [destinationPath, setDestinationPath] = useState([])
  const [currentDestinationIndex, setCurrentDestinationIndex] = useState(0)

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  // Initialize members and destination path from room data
  useEffect(() => {
    const initialMembers = {}
    room.users.forEach(u => {
      initialMembers[u.id] = {
        ...u,
        location: u.location || null,
        destination: u.destination || null,
        lastSeen: new Date()
      }
    })
    setMembers(initialMembers)

    // Initialize destination path
    if (room.destinationPath) {
      setDestinationPath(room.destinationPath)
    }
    if (room.currentDestinationIndex !== undefined) {
      setCurrentDestinationIndex(room.currentDestinationIndex)
    }
  }, [room])

  // Use custom hooks
  useLocationTracking(user.id, (location) => {
    setMembers(prev => ({
      ...prev,
      [user.id]: {
        ...prev[user.id],
        location,
        lastSeen: new Date()
      }
    }))
  })

  useSocketEvents(
    room.code,
    user.id,
    members,
    setMembers,
    setDestinationPath,
    setCurrentDestinationIndex,
    showNotification
  )

  const handleLeaveRoom = async () => {
    try {
      await leaveRoom(room.code, user.id)
      onLeaveRoom()
      showNotification('Left room successfully', 'info')
    } catch (error) {
      showNotification(error.message, 'error')
    }
  }

  const handleTogglePaths = () => {
    setPathsVisible(!pathsVisible)
    showNotification(`Path history ${!pathsVisible ? 'shown' : 'hidden'}`, 'info')
  }

  const handleExport = async (format) => {
    try {
      const url = `http://localhost:5000/api/rooms/${room.code}/export?format=${format}`
      window.open(url, '_blank')
      showNotification(`Exporting route as ${format.toUpperCase()}...`, 'success')
    } catch (error) {
      showNotification('Failed to export route', 'error')
    }
  }

  return (
    <div className="main-content">
      <div className="sidebar">
        <div className="room-info">
          <div><strong>Room:</strong> <span className="room-code">{room.code}</span></div>
          <div><strong>Role:</strong> {isLeader ? 'Leader 👑' : 'Member'}</div>
          <div><strong>Members:</strong> {Object.keys(members).length}</div>
        </div>

        <MemberList members={members} />

        {isLeader && (
          <LeaderControls
            destinationPath={destinationPath}
            currentDestinationIndex={currentDestinationIndex}
            onTogglePaths={handleTogglePaths}
            pathsVisible={pathsVisible}
            onExport={handleExport}
          />
        )}

        <div style={{ marginTop: '20px' }}>
          <button className="btn btn-secondary" onClick={handleLeaveRoom}>
            🚪 Leave Room
          </button>
        </div>
      </div>

      <MapView
        members={members}
        currentUserId={user.id}
        isLeader={isLeader}
        pathsVisible={pathsVisible}
        destinationPath={destinationPath}
        currentDestinationIndex={currentDestinationIndex}
      />

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
        />
      )}
    </div>
  )
}

export default RoomInterface
