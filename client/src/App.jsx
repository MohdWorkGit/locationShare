import { useState, useEffect } from 'react'
import RoomSetup from './components/RoomSetup'
import RoomInterface from './components/RoomInterface'
import { initializeSocket, disconnectSocket } from './services/socketService'
import './styles/App.css'

function App() {
  const [currentRoom, setCurrentRoom] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [isLeader, setIsLeader] = useState(false)

  useEffect(() => {
    // Initialize socket connection
    initializeSocket()

    return () => {
      // Cleanup on unmount
      disconnectSocket()
    }
  }, [])

  const handleRoomCreated = (room, user) => {
    setCurrentRoom(room)
    setCurrentUser(user)
    setIsLeader(true)
  }

  const handleRoomJoined = (room, user) => {
    setCurrentRoom(room)
    setCurrentUser(user)
    setIsLeader(false)
  }

  const handleLeaveRoom = () => {
    setCurrentRoom(null)
    setCurrentUser(null)
    setIsLeader(false)
  }

  return (
    <div className="app">
      <div className="container">
        <div className="header">
          <h1>🌍 Live Location Tracker</h1>
          <p>Real-time group coordination and tracking</p>
        </div>

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

export default App
