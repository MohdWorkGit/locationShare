import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import RoomSetup from './components/RoomSetup'
import RoomInterface from './components/RoomInterface'
import AdminPage from './pages/AdminPage'
import { initializeSocket, disconnectSocket, onLeaderRoleUpdated } from './services/socketService'
import { useLanguage } from './contexts/LanguageContext'
import { saveSession, getSession, clearSession } from './utils/sessionStorage'
import { joinRoom } from './services/api'
import './styles/App.css'

function MainApp() {
  const [currentRoom, setCurrentRoom] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [isLeader, setIsLeader] = useState(false)
  const [isRejoining, setIsRejoining] = useState(false)
  const { language, toggleLanguage, t } = useLanguage()

  // Check for saved session and attempt to rejoin on mount
  useEffect(() => {
    const attemptRejoin = async () => {
      const savedSession = getSession()
      if (savedSession && savedSession.room && savedSession.user) {
        console.log('Found saved session, attempting to rejoin:', savedSession)
        setIsRejoining(true)

        try {
          // Try to rejoin the room using the saved room code and user info
          const response = await joinRoom(
            savedSession.room.code,
            savedSession.user.name,
            savedSession.user.color,
            savedSession.user.icon
          )

          if (response.success) {
            console.log('Successfully rejoined room:', response)

            // Find the current user in the room's user list to get their actual leader status
            const currentUserData = response.room.users.find(u => u.id === response.userId)
            const actualIsLeader = currentUserData?.isLeader || false

            // Set the room and user state
            setCurrentRoom(response.room)
            setCurrentUser({
              id: response.userId,
              ...savedSession.user
            })
            setIsLeader(actualIsLeader)

            // Update the saved session with the actual leader status from server
            saveSession({
              room: response.room,
              user: {
                id: response.userId,
                ...savedSession.user
              },
              isLeader: actualIsLeader
            })
          }
        } catch (error) {
          console.error('Failed to rejoin room:', error)
          // Clear the invalid session
          clearSession()
        } finally {
          setIsRejoining(false)
        }
      }
    }

    attemptRejoin()
  }, [])

  useEffect(() => {
    // Initialize socket connection
    initializeSocket()

    // Listen for leader role updates from admin
    onLeaderRoleUpdated((data) => {
      const { userId, isLeader: newIsLeader } = data
      // Update isLeader state if the update is for the current user
      if (currentUser && userId === currentUser.id) {
        setIsLeader(newIsLeader)
        console.log(`Your role updated: ${newIsLeader ? 'Leader' : 'Member'}`)
      }
    })

    return () => {
      // Cleanup on unmount
      disconnectSocket()
    }
  }, [currentUser])

  const handleRoomCreated = (room, user) => {
    setCurrentRoom(room)
    setCurrentUser(user)
    setIsLeader(true)

    // Save session to localStorage
    saveSession({
      room,
      user: { ...user, isLeader: true },
      isLeader: true
    })
  }

  const handleRoomJoined = (room, user) => {
    const userIsLeader = user.isLeader || false
    setCurrentRoom(room)
    setCurrentUser(user)
    setIsLeader(userIsLeader)

    // Save session to localStorage
    saveSession({
      room,
      user: { ...user, isLeader: userIsLeader },
      isLeader: userIsLeader
    })
  }

  const handleLeaveRoom = () => {
    setCurrentRoom(null)
    setCurrentUser(null)
    setIsLeader(false)

    // Clear session from localStorage
    clearSession()
  }

  return (
    <div className="app">
      {/* Language Toggle Button */}
      {/* <button
        className="language-toggle"
        onClick={toggleLanguage}
        title={language === 'en' ? 'التبديل إلى العربية' : 'Switch to English'}
      >
        {language === 'en' ? 'عربي' : 'English'}
      </button> */}

      <div className={`container ${currentRoom ? 'no-header' : ''}`}>
        {!currentRoom && (
          <div className="header">
            <h1>🌍 {t('app.title')}</h1>
            <p>{t('app.subtitle')}</p>
          </div>
        )}

        {isRejoining ? (
          <div className="loading-container" style={{ textAlign: 'center', padding: '50px' }}>
            <h2>Rejoining your previous session...</h2>
            <p>Please wait...</p>
          </div>
        ) : !currentRoom ? (
          <RoomSetup
            onRoomCreated={handleRoomCreated}
            onRoomJoined={handleRoomJoined}
          />
        ) : (
          <RoomInterface
            room={currentRoom}
            user={currentUser}
            isLeader={isLeader}
            onLeaveRoom={handleLeaveRoom}
          />
        )}
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
