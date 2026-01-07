import { useState, useEffect, useRef } from 'react'
import MapView from './MapView'
import MemberList from './MemberList'
import LeaderControls from './LeaderControls'
import Notification from './Notification'
import { useLocationTracking } from '../hooks/useLocationTracking'
import { useSocketEvents } from '../hooks/useSocketEvents'
import { leaveRoom } from '../services/api'
import { useLanguage } from '../contexts/LanguageContext'

function RoomInterface({ room, user, isLeader, onLeaveRoom }) {
  const { t, isRTL } = useLanguage()
  const [members, setMembers] = useState({})
  const [pathsVisible, setPathsVisible] = useState(false)
  const [notification, setNotification] = useState(null)
  const [destinationPath, setDestinationPath] = useState([])
  const [currentDestinationIndex, setCurrentDestinationIndex] = useState(0)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('sidebarWidth')
    return saved ? parseInt(saved) : 400
  })
  const [isResizing, setIsResizing] = useState(false)
  const sidebarRef = useRef(null)

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  const handleMouseDown = (e) => {
    e.preventDefault()
    setIsResizing(true)
  }

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return

      const minWidth = 300
      const maxWidth = 800

      let newWidth
      if (isRTL) {
        // RTL: sidebar is on the right, calculate from right edge
        newWidth = window.innerWidth - e.clientX
      } else {
        // LTR: sidebar is on the left, calculate from left edge
        newWidth = e.clientX
      }

      newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth))
      setSidebarWidth(newWidth)
    }

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false)
        localStorage.setItem('sidebarWidth', sidebarWidth.toString())
      }
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'ew-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing, sidebarWidth, isRTL])

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
      showNotification(t('notifications.leftRoom'), 'info')
    } catch (error) {
      showNotification(error.message, 'error')
    }
  }

  const handleTogglePaths = () => {
    setPathsVisible(!pathsVisible)
    const status = !pathsVisible ? t('notifications.shown') : t('notifications.hidden')
    showNotification(`${t('notifications.pathHistory')} ${status}`, 'info')
  }

  const handleExport = async (format) => {
    try {
      // Construct API URL using environment variable or relative URL
      const apiBaseUrl = import.meta.env.VITE_API_URL || window.location.origin
      const url = `${apiBaseUrl}/api/rooms/${room.code}/export?format=${format}`
      window.open(url, '_blank')
      showNotification(`${t('notifications.exporting')} ${format.toUpperCase()}...`, 'success')
    } catch (error) {
      showNotification(t('notifications.failed'), 'error')
    }
  }

  return (
    <div
      className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}
      style={{
        gridTemplateColumns: sidebarCollapsed
          ? (isRTL ? '1fr 0' : '0 1fr')
          : (isRTL ? `1fr ${sidebarWidth}px` : `${sidebarWidth}px 1fr`)
      }}
    >
      {/* Sidebar Toggle Button */}
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        {sidebarCollapsed ? '☰' : '✕'}
      </button>

      <div
        ref={sidebarRef}
        className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}
        style={{ width: sidebarCollapsed ? 0 : `${sidebarWidth}px` }}
      >
        <div className="room-info">
          <div><strong>{t('room.roomLabel')}:</strong> <span className="room-code">{room.code}</span></div>
          <div><strong>{t('room.role')}:</strong> {isLeader ? `${t('room.leader')} 👑` : t('room.member')}</div>
          <div><strong>{t('room.members')}:</strong> {Object.keys(members).length}</div>
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
            🚪 {t('room.leaveRoom')}
          </button>
        </div>

        {/* Resize Handle */}
        {!sidebarCollapsed && (
          <div
            className={`sidebar-resize-handle ${isRTL ? 'rtl' : 'ltr'}`}
            onMouseDown={handleMouseDown}
          />
        )}
      </div>

      <MapView
        members={members}
        currentUserId={user.id}
        isLeader={isLeader}
        pathsVisible={pathsVisible}
        destinationPath={destinationPath}
        currentDestinationIndex={currentDestinationIndex}
        sidebarCollapsed={sidebarCollapsed}
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
