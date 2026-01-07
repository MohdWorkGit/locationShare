import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import {
  getAdminRooms,
  createAdminRoom,
  deleteAdminRoom,
  updateRoom,
  getRoomDetails,
  assignLeader,
  removeLeader
} from '../services/adminApi';
import MapView from '../components/MapView';
import '../styles/AdminPage.css';

function AdminPage() {
  const { t, language, toggleLanguage } = useLanguage();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRoomDetails, setShowRoomDetails] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomPublic, setNewRoomPublic] = useState(true);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      setLoading(true);
      const response = await getAdminRooms();
      setRooms(response.rooms);
    } catch (error) {
      showNotification(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) {
      showNotification(t('admin.roomNameRequired'), 'error');
      return;
    }

    try {
      await createAdminRoom(newRoomName, newRoomPublic);
      showNotification(t('admin.roomCreated'), 'success');
      setShowCreateModal(false);
      setNewRoomName('');
      setNewRoomPublic(true);
      loadRooms();
    } catch (error) {
      showNotification(error.message, 'error');
    }
  };

  const handleDeleteRoom = async (roomCode) => {
    if (!window.confirm(t('admin.confirmDelete'))) return;

    try {
      await deleteAdminRoom(roomCode);
      showNotification(t('admin.roomDeleted'), 'success');
      loadRooms();
      if (selectedRoom?.code === roomCode) {
        setSelectedRoom(null);
        setShowRoomDetails(false);
      }
    } catch (error) {
      showNotification(error.message, 'error');
    }
  };

  const handleTogglePublic = async (roomCode, currentPublic) => {
    try {
      await updateRoom(roomCode, { isPublic: !currentPublic });
      showNotification(t('admin.roomUpdated'), 'success');
      loadRooms();
    } catch (error) {
      showNotification(error.message, 'error');
    }
  };

  const handleViewRoom = async (room) => {
    try {
      const response = await getRoomDetails(room.code);
      setSelectedRoom(response.room);
      setShowRoomDetails(true);
    } catch (error) {
      showNotification(error.message, 'error');
    }
  };

  const handleRemoveLeader = async (userId) => {
    if (!selectedRoom) return;
    if (!window.confirm(t('admin.confirmRemoveLeader'))) return;

    try {
      await removeLeader(selectedRoom.code, userId);
      showNotification(t('admin.leaderRemoved'), 'success');
      const response = await getRoomDetails(selectedRoom.code);
      setSelectedRoom(response.room);
      loadRooms();
    } catch (error) {
      showNotification(error.message, 'error');
    }
  };

  const handleMakeLeader = async (userId) => {
    if (!selectedRoom) return;

    const user = selectedRoom.users.find(u => u.id === userId);
    if (!user) return;

    try {
      await assignLeader(selectedRoom.code, userId, user.name, user.color, user.icon);
      showNotification(t('admin.leaderAssigned'), 'success');
      const response = await getRoomDetails(selectedRoom.code);
      setSelectedRoom(response.room);
      loadRooms();
    } catch (error) {
      showNotification(error.message, 'error');
    }
  };

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-header">
        <div className="admin-header-content">
          <h1>🔐 {t('admin.title')}</h1>
          <div className="admin-header-actions">
            <button onClick={() => navigate('/')} className="btn btn-secondary">
              🏠 {t('admin.backToHome')}
            </button>
            <button onClick={toggleLanguage} className="btn btn-lang">
              {language === 'en' ? 'عربي' : 'English'}
            </button>
          </div>
        </div>
      </div>

      <div className="admin-container">
        {/* Rooms List */}
        <div className="admin-sidebar">
          <div className="admin-sidebar-header">
            <h2>{t('admin.rooms')}</h2>
            <button onClick={() => setShowCreateModal(true)} className="btn btn-create">
              + {t('admin.createRoom')}
            </button>
          </div>

          {loading ? (
            <div className="admin-loading">{t('admin.loading')}</div>
          ) : rooms.length === 0 ? (
            <div className="admin-empty">{t('admin.noRooms')}</div>
          ) : (
            <div className="rooms-list">
              {rooms.map(room => (
                <div
                  key={room.code}
                  className={`room-card ${selectedRoom?.code === room.code ? 'active' : ''}`}
                  onClick={() => handleViewRoom(room)}
                >
                  <div className="room-card-header">
                    <h3>{room.roomName}</h3>
                    <span className={`room-status ${room.isPublic ? 'public' : 'private'}`}>
                      {room.isPublic ? '🌐' : '🔒'}
                    </span>
                  </div>
                  <div className="room-card-body">
                    <div className="room-info-item">
                      <span className="label">{t('admin.code')}:</span>
                      <span className="value room-code">{room.code}</span>
                    </div>
                    <div className="room-info-item">
                      <span className="label">{t('admin.users')}:</span>
                      <span className="value">{room.userCount} ({room.onlineCount} {t('admin.online')})</span>
                    </div>
                    <div className="room-info-item">
                      <span className="label">{t('admin.leaders')}:</span>
                      <span className="value">{room.leaderIds.length}</span>
                    </div>
                  </div>
                  <div className="room-card-actions">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTogglePublic(room.code, room.isPublic);
                      }}
                      className="btn-icon"
                      title={room.isPublic ? t('admin.makePrivate') : t('admin.makePublic')}
                    >
                      {room.isPublic ? '🔒' : '🌐'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRoom(room.code);
                      }}
                      className="btn-icon btn-delete"
                      title={t('admin.deleteRoom')}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Room Details */}
        {showRoomDetails && selectedRoom ? (
          <div className="admin-main">
            <div className="room-details">
              <div className="room-details-header">
                <h2>{selectedRoom.roomName}</h2>
                <button
                  onClick={() => {
                    setShowRoomDetails(false);
                    setSelectedRoom(null);
                  }}
                  className="btn-close"
                >
                  ✕
                </button>
              </div>

              {/* Users & Leaders */}
              <div className="room-details-section">
                <h3>{t('admin.usersAndLeaders')}</h3>
                {selectedRoom.users.length === 0 ? (
                  <p className="empty-state">{t('admin.noUsers')}</p>
                ) : (
                  <div className="users-grid">
                    {selectedRoom.users.map(user => (
                      <div key={user.id} className="user-card">
                        <div className="user-icon" style={{ backgroundColor: user.color }}>
                          {user.icon}
                        </div>
                        <div className="user-info">
                          <div className="user-name">
                            {user.name}
                            {user.isLeader && <span className="leader-badge">👑</span>}
                          </div>
                          <div className="user-status">
                            <span className={`status-dot ${user.online ? 'online' : 'offline'}`}></span>
                            {user.online ? t('admin.online') : t('admin.offline')}
                          </div>
                        </div>
                        <div className="user-actions">
                          {user.isLeader ? (
                            selectedRoom.leaderIds.length > 1 && (
                              <button
                                onClick={() => handleRemoveLeader(user.id)}
                                className="btn btn-small btn-secondary"
                              >
                                {t('admin.removeLeader')}
                              </button>
                            )
                          ) : (
                            <button
                              onClick={() => handleMakeLeader(user.id)}
                              className="btn btn-small"
                            >
                              {t('admin.makeLeader')}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Map View */}
              <div className="room-details-section">
                <h3>{t('admin.mapView')}</h3>
                <div className="admin-map-container">
                  <MapView
                    members={selectedRoom.users.reduce((acc, user) => {
                      acc[user.id] = user;
                      return acc;
                    }, {})}
                    currentUserId={selectedRoom.users[0]?.id || 'admin'}
                    isLeader={false}
                    pathsVisible={true}
                    destinationPath={selectedRoom.destinationPath}
                    currentDestinationIndex={selectedRoom.currentDestinationIndex}
                    sidebarCollapsed={true}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="admin-main admin-empty-state">
            <div className="empty-state-content">
              <span className="empty-icon">🗺️</span>
              <h2>{t('admin.selectRoom')}</h2>
              <p>{t('admin.selectRoomDesc')}</p>
            </div>
          </div>
        )}
      </div>

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('admin.createRoom')}</h2>
              <button onClick={() => setShowCreateModal(false)} className="btn-close">✕</button>
            </div>
            <form onSubmit={handleCreateRoom} className="modal-body">
              <div className="form-group">
                <label>{t('admin.roomName')}</label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder={t('admin.roomNamePlaceholder')}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={newRoomPublic}
                    onChange={(e) => setNewRoomPublic(e.target.checked)}
                  />
                  <span>{t('admin.publicRoom')}</span>
                </label>
                <small>{t('admin.publicRoomDesc')}</small>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
                  {t('admin.cancel')}
                </button>
                <button type="submit" className="btn">
                  {t('admin.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div className={`notification show ${notification.type}`}>
          {notification.message}
        </div>
      )}
    </div>
  );
}

export default AdminPage;
