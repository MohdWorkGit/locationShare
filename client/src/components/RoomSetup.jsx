import { useState, useEffect } from 'react'
import { createRoom, joinRoom } from '../services/api'
import { getPublicRooms } from '../services/adminApi'
import { useLanguage } from '../contexts/LanguageContext'
import ColorSelector from './ColorSelector'
import IconSelector from './IconSelector'
import PhotoUpload from './PhotoUpload'
import Notification from './Notification'

const LEADER_ICONS = ['👑', '🚀', '⭐', '🎯']
const MEMBER_ICONS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟']

function RoomSetup({ onRoomCreated, onRoomJoined }) {
  const { t } = useLanguage()
  const [view, setView] = useState('initial') // initial, create, join, selectRoom
  const [name, setName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [selectedColor, setSelectedColor] = useState('#3498db')
  const [selectedIcon, setSelectedIcon] = useState('👑')
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [notification, setNotification] = useState(null)
  const [loading, setLoading] = useState(false)
  const [publicRooms, setPublicRooms] = useState([])
  const [loadingRooms, setLoadingRooms] = useState(false)

  useEffect(() => {
    if (view === 'selectRoom') {
      loadPublicRooms();
    }
  }, [view]);

  const loadPublicRooms = async () => {
    setLoadingRooms(true);
    try {
      const response = await getPublicRooms();
      setPublicRooms(response.rooms);
    } catch (error) {
      showNotification(error.message, 'error');
    } finally {
      setLoadingRooms(false);
    }
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const handleSelectRoom = async (room) => {
    setRoomCode(room.code);
    setView('join');
    setSelectedIcon(MEMBER_ICONS[0]);
  };

  const handleCreateRoom = async () => {
    if (!name.trim()) {
      showNotification('Please enter your name', 'error')
      return
    }

    setLoading(true)
    try {
      const icon = selectedPhoto || selectedIcon
      const result = await createRoom(name, selectedColor, icon)
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
      const icon = selectedPhoto || selectedIcon
      const result = await joinRoom(roomCode.toUpperCase(), name, selectedColor, icon)
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
      <h2>🚀 {t('app.title')}</h2>
      <div className="form-group">
        <button className="btn" onClick={() => setView('selectRoom')}>
          🌐 {t('setup.selectPublicRoom')}
        </button>
        <button className="btn" onClick={() => setView('create')}>
          👑 {t('setup.createRoom')}
        </button>
        <button className="btn btn-secondary" onClick={() => setView('join')}>
          🚪 {t('setup.joinRoom')}
        </button>
      </div>
    </div>
  )

  const renderSelectRoomView = () => (
    <div className="setup-form">
      <h2>🌐 {t('setup.selectPublicRoom')}</h2>
      {loadingRooms ? (
        <div className="loading-rooms">{t('setup.loadingRooms')}</div>
      ) : publicRooms.length === 0 ? (
        <div className="empty-rooms">{t('setup.noPublicRooms')}</div>
      ) : (
        <div className="public-rooms-list">
          {publicRooms.map(room => (
            <div
              key={room.code}
              className="public-room-card"
              onClick={() => handleSelectRoom(room)}
            >
              <div className="room-header">
                <h3>{room.roomName}</h3>
                <span className="room-badge">{room.onlineCount}/{room.userCount} {t('setup.online')}</span>
              </div>
              <div className="room-code-display">
                {t('admin.code')}: <strong>{room.code}</strong>
              </div>
            </div>
          ))}
        </div>
      )}
      <button className="btn btn-secondary" onClick={() => setView('initial')}>
        {t('setup.backToSetup')}
      </button>
    </div>
  )

  const renderCreateView = () => (
    <div className="setup-form">
      <h2>👑 {t('setup.createRoom')}</h2>
      <div className="form-group">
        <label>{t('setup.name')}</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('setup.name')}
        />
      </div>

      <div className="form-group">
        <label>{t('setup.chooseColor')}</label>
        <ColorSelector
          selectedColor={selectedColor}
          onColorSelect={setSelectedColor}
        />
      </div>

      <div className="form-group">
        <label>{t('setup.uploadPhoto')}</label>
        <PhotoUpload
          selectedPhoto={selectedPhoto}
          onPhotoSelect={setSelectedPhoto}
        />
      </div>

      {!selectedPhoto && (
        <div className="form-group">
          <label>{t('setup.chooseIcon')}</label>
          <IconSelector
            icons={LEADER_ICONS}
            selectedIcon={selectedIcon}
            onIconSelect={setSelectedIcon}
          />
        </div>
      )}

      <button className="btn" onClick={handleCreateRoom} disabled={loading}>
        {loading ? '...' : t('setup.createAndStart')}
      </button>
      <button className="btn btn-secondary" onClick={() => setView('initial')}>
        {t('setup.backToSetup')}
      </button>
    </div>
  )

  const renderJoinView = () => (
    <div className="setup-form">
      <h2>🚪 {t('setup.joinRoom')}</h2>
      <div className="form-group">
        <label>{t('setup.roomCode')}</label>
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
        <label>Profile Photo or Icon</label>
        <PhotoUpload
          selectedPhoto={selectedPhoto}
          onPhotoSelect={setSelectedPhoto}
        />
      </div>

      {!selectedPhoto && (
        <div className="form-group">
          <label>Or Choose an Icon</label>
          <IconSelector
            icons={MEMBER_ICONS}
            selectedIcon={selectedIcon}
            onIconSelect={setSelectedIcon}
          />
        </div>
      )}

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
        {view === 'selectRoom' && renderSelectRoomView()}
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
