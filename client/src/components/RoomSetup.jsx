import { useState } from 'react'
import { createRoom, joinRoom } from '../services/api'
import ColorSelector from './ColorSelector'
import IconSelector from './IconSelector'
import Notification from './Notification'

const LEADER_ICONS = ['👑', '🚀', '⭐', '🎯']
const MEMBER_ICONS = ['🏃', '🚶', '🏃‍♀️', '🚶‍♀️', '🏃‍♂️', '🚶‍♂️', '🎭', '🎪']

function RoomSetup({ onRoomCreated, onRoomJoined }) {
  const [view, setView] = useState('initial') // initial, create, join
  const [name, setName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [selectedColor, setSelectedColor] = useState('#3498db')
  const [selectedIcon, setSelectedIcon] = useState('👑')
  const [notification, setNotification] = useState(null)
  const [loading, setLoading] = useState(false)

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const handleCreateRoom = async () => {
    if (!name.trim()) {
      showNotification('Please enter your name', 'error')
      return
    }

    setLoading(true)
    try {
      const result = await createRoom(name, selectedColor, selectedIcon)
      onRoomCreated(result.room, { ...result.room.users[0], id: result.userId })
      showNotification('Room created successfully!', 'success')
    } catch (error) {
      showNotification(error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleJoinRoom = async () => {
    if (!roomCode.trim() || !name.trim()) {
      showNotification('Please enter both room code and your name', 'error')
      return
    }

    setLoading(true)
    try {
      const result = await joinRoom(roomCode.toUpperCase(), name, selectedColor, selectedIcon)
      const user = result.room.users.find(u => u.id === result.userId)
      onRoomJoined(result.room, user)
      showNotification('Joined room successfully!', 'success')
    } catch (error) {
      showNotification(error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const renderInitialView = () => (
    <div className="setup-form">
      <h2>🚀 Get Started</h2>
      <div className="form-group">
        <button className="btn" onClick={() => setView('create')}>
          Create New Room (Leader)
        </button>
        <button className="btn btn-secondary" onClick={() => setView('join')}>
          Join Existing Room
        </button>
      </div>
    </div>
  )

  const renderCreateView = () => (
    <div className="setup-form">
      <h2>👑 Create Room</h2>
      <div className="form-group">
        <label>Your Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
        />
      </div>

      <div className="form-group">
        <label>Choose Your Color</label>
        <ColorSelector
          selectedColor={selectedColor}
          onColorSelect={setSelectedColor}
        />
      </div>

      <div className="form-group">
        <label>Choose Your Icon</label>
        <IconSelector
          icons={LEADER_ICONS}
          selectedIcon={selectedIcon}
          onIconSelect={setSelectedIcon}
        />
      </div>

      <button className="btn" onClick={handleCreateRoom} disabled={loading}>
        {loading ? 'Creating...' : 'Create Room & Start Tracking'}
      </button>
      <button className="btn btn-secondary" onClick={() => setView('initial')}>
        Back
      </button>
    </div>
  )

  const renderJoinView = () => (
    <div className="setup-form">
      <h2>🚪 Join Room</h2>
      <div className="form-group">
        <label>Room Code</label>
        <input
          type="text"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
          placeholder="Enter room code"
        />
      </div>

      <div className="form-group">
        <label>Your Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
        />
      </div>

      <div className="form-group">
        <label>Choose Your Color</label>
        <ColorSelector
          selectedColor={selectedColor}
          onColorSelect={setSelectedColor}
        />
      </div>

      <div className="form-group">
        <label>Choose Your Icon</label>
        <IconSelector
          icons={MEMBER_ICONS}
          selectedIcon={selectedIcon}
          onIconSelect={setSelectedIcon}
        />
      </div>

      <button className="btn" onClick={handleJoinRoom} disabled={loading}>
        {loading ? 'Joining...' : 'Join Room & Start Tracking'}
      </button>
      <button className="btn btn-secondary" onClick={() => setView('initial')}>
        Back
      </button>
    </div>
  )

  return (
    <div className="main-content-setup">
      <div className="sidebar">
        {view === 'initial' && renderInitialView()}
        {view === 'create' && renderCreateView()}
        {view === 'join' && renderJoinView()}
      </div>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
        />
      )}
    </div>
  )
}

export default RoomSetup
