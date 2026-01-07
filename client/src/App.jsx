import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import RoomSetup from './components/RoomSetup'
import RoomInterface from './components/RoomInterface'
import AdminPage from './pages/AdminPage'
import { initializeSocket, disconnectSocket, onLeaderRoleUpdated } from './services/socketService'
import { useLanguage } from './contexts/LanguageContext'
import './styles/App.css'

function MainApp() {
  const [currentRoom, setCurrentRoom] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [isLeader, setIsLeader] = useState(false)
  const { language, toggleLanguage, t } = useLanguage()

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
  }

  const handleRoomJoined = (room, user) => {
    setCurrentRoom(room)
    setCurrentUser(user)
    setIsLeader(false)
    if(user.isLeader){
       setIsLeader(true)
    }
   
  }

  const handleLeaveRoom = () => {
    setCurrentRoom(null)
    setCurrentUser(null)
    setIsLeader(false)
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

        {!currentRoom ? (
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
