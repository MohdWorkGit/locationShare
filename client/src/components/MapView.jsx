import { useEffect, useState, useRef, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import { addDestinationToPath, updateDestinationInPath } from '../services/socketService'
import { useLanguage } from '../contexts/LanguageContext'
import { isSafari } from '../utils/platformDetection'
import 'leaflet/dist/leaflet.css'

function MapClickHandler({ isLeader, onMapClick }) {
  useMapEvents({
    click: (e) => {
      if (isLeader) {
        onMapClick(e.latlng)
      }
    }
  })
  return null
}

function MapController({ mapRef }) {
  const map = useMap()

  useEffect(() => {
    mapRef.current = map
  }, [map, mapRef])

  return null
}

function ZoomTracker({ onZoomChange }) {
  const map = useMapEvents({
    zoomend: () => {
      onZoomChange(map.getZoom())
    }
  })

  useEffect(() => {
    onZoomChange(map.getZoom())
  }, [map, onZoomChange])

  return null
}

function MapView({ members, currentUserId, isLeader, pathsVisible, destinationPath, currentDestinationIndex, sidebarCollapsed, editDestinationTrigger }) {
  const { t } = useLanguage()
  const [center, setCenter] = useState([23.5880, 58.3829]) // Muscat, Oman default
  const [zoom, setZoom] = useState(13)
  const [currentZoom, setCurrentZoom] = useState(13)
  const [hasSetInitialView, setHasSetInitialView] = useState(false)
  const [mapType, setMapType] = useState('street') // street or satellite
  const [trackingMode, setTrackingMode] = useState('user') // 'none', 'user', 'destination'
  const [showDestinationModal, setShowDestinationModal] = useState(false)
  const [editingDestinationIndex, setEditingDestinationIndex] = useState(null)
  const [destinationNote, setDestinationNote] = useState('')
  const [destinationColor, setDestinationColor] = useState('#ff6b6b')
  const [destinationSize, setDestinationSize] = useState('medium')
  const mapRef = useRef(null)
  const longPressTimerRef = useRef(null)

  // Watch for external edit triggers (from destination list)
  useEffect(() => {
    if (editDestinationTrigger && editDestinationTrigger.index !== null) {
      openEditModal(editDestinationTrigger.index)
    }
  }, [editDestinationTrigger])

  // Invalidate map size when sidebar toggles
  useEffect(() => {
    if (mapRef.current) {
      // Use setTimeout to ensure the CSS transition completes first
      setTimeout(() => {
        mapRef.current.invalidateSize()
      }, 300) // Match the CSS transition duration
    }
  }, [sidebarCollapsed])

  // Set initial view to leader's location
  useEffect(() => {
    if (!hasSetInitialView) {
      // Find the leader
      const leader = Object.values(members).find(member => member.isLeader)
      if (leader?.location) {
        const { lat, lng } = leader.location
        setCenter([lat, lng])
        setZoom(15)
        setHasSetInitialView(true)
      }
    }
  }, [members, hasSetInitialView])

  // Track user location when in user tracking mode
  useEffect(() => {
    if (trackingMode === 'user' && mapRef.current && members[currentUserId]?.location) {
      const { lat, lng } = members[currentUserId].location
      mapRef.current.setView([lat, lng], mapRef.current.getZoom(), { animate: true })
    }
  }, [trackingMode, members, currentUserId])

  // Track destination when in destination tracking mode
  useEffect(() => {
    if (trackingMode === 'destination' && mapRef.current && destinationPath && destinationPath.length > 0) {
      const currentDest = destinationPath[currentDestinationIndex]
      if (currentDest) {
        mapRef.current.setView([currentDest.lat, currentDest.lng], mapRef.current.getZoom(), { animate: true })
      }
    }
  }, [trackingMode, destinationPath, currentDestinationIndex])

  const handleMapClick = (latlng) => {
    if (isLeader) {
      // Add destination immediately with default values
      // Don't set size - let it be determined by current/visited status
      addDestinationToPath({
        lat: latlng.lat,
        lng: latlng.lng,
        note: '',
        color: ''  // Empty color means use default colors based on status
      })
    }
  }

  const openEditModal = (index) => {
    const dest = destinationPath[index]
    const isCurrent = index === currentDestinationIndex

    const sizeToOption = (size) => {
      // If no custom size, determine based on current status
      if (!size || size <= 0) {
        return isCurrent ? 'large' : 'small'
      }
      if (size <= 35) return 'small'
      if (size <= 60) return 'medium'
      return 'large'
    }

    setEditingDestinationIndex(index)
    setDestinationNote(dest.note || '')
    setDestinationColor((dest.color && dest.color !== '') ? dest.color : '#ff6b6b')
    setDestinationSize(sizeToOption(dest.size))
    setShowDestinationModal(true)
  }

  const handleDestinationContextMenu = (index, e) => {
    if (!isLeader) return

    // Prevent default context menu
    if (e && e.originalEvent) {
      e.originalEvent.preventDefault()
    }

    openEditModal(index)
  }

  const handleDestinationMouseDown = (index) => {
    if (!isLeader) return

    longPressTimerRef.current = setTimeout(() => {
      // Long press detected - open edit modal
      openEditModal(index)
    }, 500) // 500ms for long press
  }

  const handleDestinationMouseUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  const handleSaveDestination = () => {
    const sizeMap = {
      small: 30,
      medium: 50,
      large: 70
    }

    if (editingDestinationIndex !== null) {
      // Update existing destination
      updateDestinationInPath(editingDestinationIndex, {
        note: destinationNote.trim() || '',
        color: destinationColor,
        size: sizeMap[destinationSize] || 50
      })
    }

    setShowDestinationModal(false)
    setEditingDestinationIndex(null)
    setDestinationNote('')
  }

  const handleCancelDestination = () => {
    setShowDestinationModal(false)
    setEditingDestinationIndex(null)
    setDestinationNote('')
  }

  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.zoomIn()
    }
  }

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.zoomOut()
    }
  }

  const handleCenterOnMe = () => {
    if (mapRef.current && members[currentUserId]?.location) {
      const { lat, lng } = members[currentUserId].location
      mapRef.current.flyTo([lat, lng], 15, { duration: 1 })
      // Toggle tracking mode
      setTrackingMode(trackingMode === 'user' ? 'none' : 'user')
    }
  }

  const handleCenterOnDestination = () => {
    if (mapRef.current && destinationPath && destinationPath.length > 0) {
      const currentDest = destinationPath[currentDestinationIndex]
      if (currentDest) {
        mapRef.current.flyTo([currentDest.lat, currentDest.lng], 15, { duration: 1 })
        // Toggle tracking mode
        setTrackingMode(trackingMode === 'destination' ? 'none' : 'destination')
      }
    }
  }

  const isPhotoIcon = (icon) => {
    return icon && icon.startsWith('data:image')
  }

  const createCustomIcon = (member) => {
    const iconContent = isPhotoIcon(member.icon)
      ? `<img src="${member.icon}" alt="${member.name}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" />`
      : member.icon

    // Safari: Use lighter styles to reduce rendering overhead
    const safariOptimized = isSafari()
    const borderWidth = safariOptimized ? '2px' : '3px'
    const boxShadow = safariOptimized ? 'none' : '0 2px 8px rgba(0,0,0,0.3)'

    return L.divIcon({
      className: 'custom-marker',
      html: `<div class="member-icon" style="background-color: ${member.color}; border: ${borderWidth} solid white; box-shadow: ${boxShadow}; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 18px; color: white; font-weight: bold; overflow: hidden;">
        ${iconContent}
      </div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    })
  }

  const createDestinationIcon = (dest, number, isCurrent, isVisited, leaderIcon) => {
    // Use custom color if provided, otherwise use default colors
    const hasCustomColor = dest.color && dest.color !== ''
    const bgColor = hasCustomColor ? dest.color : (isVisited ? '#9e9e9e' : isCurrent ? '#ff9800' : '#ff6b6b')
    let content = '' // No content for old destinations - just empty markers

    // Use target icon (🎯) for current destination instead of leader's icon
    if (isCurrent) {
      content = '🎯'
    }

    // Use custom size if provided and valid, otherwise use default sizing based on status
    const hasCustomSize = dest.size && dest.size > 0
    const size = hasCustomSize ? dest.size : (isCurrent ? 50 : 15)  // Current: 50px, Visited: 15px
    const iconSize = [size, size]
    const iconAnchor = [size / 2, size / 2]

    // Safari: Use lighter styles to reduce rendering overhead
    const safariOptimized = isSafari()
    const borderWidth = safariOptimized ? '2px' : '3px'
    const boxShadow = safariOptimized ? 'none' : '0 2px 8px rgba(0,0,0,0.3)'

    return L.divIcon({
      className: 'destination-marker',
      html: `<div style="background: ${bgColor}; color: white; border: ${borderWidth} solid white; border-radius: 50%; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center; font-weight: bold; box-shadow: ${boxShadow}; font-size: ${isCurrent ? '24px' : '12px'}; overflow: hidden;">
        ${content}
      </div>`,
      iconSize: iconSize,
      iconAnchor: iconAnchor
    })
  }

  const getLeaderIcon = () => {
    const leader = Object.values(members).find(m => m.isLeader)
    return leader?.icon || null
  }

  const getTileLayerUrl = () => {
    if (mapType === 'satellite') {
      return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    }
    return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
  }

  const getTileLayerAttribution = () => {
    if (mapType === 'satellite') {
      return '&copy; <a href="https://www.esri.com/">Esri</a>'
    }
    return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }

  return (
    <div className="map-container">
      {/* Map Controls - Right Side */}
      <div className="map-controls-right">
        {/* Map Type Toggle */}
        <button
          className="map-control-btn"
          onClick={() => setMapType(mapType === 'street' ? 'satellite' : 'street')}
          title={`${t('map.switchTo')} ${mapType === 'street' ? t('map.satellite') : t('map.street')} ${t('map.view')}`}
        >
          {mapType === 'street' ? '🛰️' : '🗺️'}
        </button>

        {/* Zoom Controls */}
        <button
          className="map-control-btn"
          onClick={handleZoomIn}
          title={t('map.zoomIn')}
        >
          +
        </button>
        <button
          className="map-control-btn"
          onClick={handleZoomOut}
          title={t('map.zoomOut')}
        >
          −
        </button>

        {/* Center on Current Location */}
        <button
          className={`map-control-btn ${trackingMode === 'user' ? 'active' : ''}`}
          onClick={handleCenterOnMe}
          title={trackingMode === 'user' ? t('map.stopTrackingLocation') : t('map.trackLocation')}
        >
          📍
        </button>

        {/* Center on Destination */}
        {destinationPath && destinationPath.length > 0 && (
          <button
            className={`map-control-btn ${trackingMode === 'destination' ? 'active' : ''}`}
            onClick={handleCenterOnDestination}
            title={trackingMode === 'destination' ? t('map.stopTrackingDestination') : t('map.trackDestination')}
          >
            🎯
          </button>
        )}
      </div>

      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        preferCanvas={isSafari()}  // Safari: use canvas renderer instead of SVG for better performance
        zoomAnimation={!isSafari()}  // Safari: disable zoom animations to reduce lag
        fadeAnimation={!isSafari()}  // Safari: disable fade animations
        markerZoomAnimation={!isSafari()}  // Safari: disable marker zoom animations
      >
        <TileLayer
          key={mapType}
          attribution={getTileLayerAttribution()}
          url={getTileLayerUrl()}
        />

        <MapController mapRef={mapRef} />

        <ZoomTracker onZoomChange={setCurrentZoom} />

        <MapClickHandler
          isLeader={isLeader}
          onMapClick={handleMapClick}
        />

        {Object.values(members).map(member => {
          if (!member.location) return null

          const { lat, lng, accuracy } = member.location
          const icon = createCustomIcon(member)

          return (
            <Marker
              key={member.id}
              position={[lat, lng]}
              icon={icon}
            >
              <Popup>
                <strong>{member.name}</strong> {member.isLeader ? '👑' : ''}
                <br />
                <small>{t('room.lastSeen')}: {new Date(member.lastSeen).toLocaleTimeString()}</small>
                {accuracy && <><br /><small>{t('map.accuracy')}: {Math.round(accuracy)}m</small></>}
              </Popup>
            </Marker>
          )
        })}

        {/* Destination Path Markers */}
        {destinationPath && destinationPath.map((dest, index) => {
          const isCurrent = index === currentDestinationIndex
          const isVisited = index < currentDestinationIndex
          const leaderIcon = getLeaderIcon()
          const icon = createDestinationIcon(dest, index + 1, isCurrent, isVisited, leaderIcon)

          return (
            <Marker
              key={`dest-${index}`}
              position={[dest.lat, dest.lng]}
              icon={icon}
              eventHandlers={{
                contextmenu: (e) => handleDestinationContextMenu(index, e),
                mousedown: () => handleDestinationMouseDown(index),
                mouseup: handleDestinationMouseUp,
                mouseleave: handleDestinationMouseUp,
                touchstart: () => handleDestinationMouseDown(index),
                touchend: handleDestinationMouseUp,
                touchcancel: handleDestinationMouseUp
              }}
            >
              {dest.note && (
                <>
                  <Tooltip
                    direction="top"
                    offset={[0, -10]}
                    opacity={0.9}
                    permanent={currentZoom >= 16}
                  >
                    <div style={{ maxWidth: '200px' }}>
                      <strong>📍 {index + 1}</strong>
                      <br />
                      {dest.note}
                    </div>
                  </Tooltip>
                  <Popup>
                    <div>
                      <strong>📍 Destination {index + 1}</strong>
                      <br />
                      <div style={{ marginTop: '8px' }}>
                        {dest.note}
                      </div>
                      {dest.addedAt && (
                        <>
                          <br />
                          <small style={{ color: '#666' }}>
                            {t('map.added')}: {new Date(dest.addedAt).toLocaleString()}
                          </small>
                        </>
                      )}
                    </div>
                  </Popup>
                </>
              )}
            </Marker>
          )
        })}

        {/* Destination Path Polyline */}
        {destinationPath && destinationPath.length > 1 && (
          <Polyline
            positions={destinationPath.map(d => [d.lat, d.lng])}
            color="#2196F3"
            weight={isSafari() ? 2 : 4}  // Safari: thinner lines for better performance
            opacity={isSafari() ? 0.6 : 0.8}  // Safari: lower opacity reduces rendering cost
            dashArray={isSafari() ? undefined : "10, 5"}  // Safari: disable dash for smoother rendering
          />
        )}

        {pathsVisible && Object.values(members).map(member => {
          if (!member.path || member.path.length < 2) return null

          const positions = member.path.map(p => [p.lat, p.lng])

          return (
            <Polyline
              key={`path-${member.id}`}
              positions={positions}
              color={member.color}
              weight={isSafari() ? 2 : 3}  // Safari: thinner lines for better performance
              opacity={isSafari() ? 0.5 : 0.7}  // Safari: lower opacity reduces rendering cost
            />
          )
        })}
      </MapContainer>

      {/* Destination Details Modal */}
      {showDestinationModal && (
        <div className="modal-overlay" onClick={handleCancelDestination}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>📍 {editingDestinationIndex !== null ? 'Edit Destination' : 'Add Destination'}</h3>

            <div className="form-group">
              <label>Note (optional)</label>
              <textarea
                value={destinationNote}
                onChange={(e) => setDestinationNote(e.target.value)}
                placeholder="Add a note for this destination..."
                rows="3"
                maxLength="200"
              />
              <small>{destinationNote.length}/200</small>
            </div>

            <div className="form-group">
              <label>Marker Color</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={destinationColor}
                  onChange={(e) => setDestinationColor(e.target.value)}
                  style={{ width: '60px', height: '40px', cursor: 'pointer' }}
                />
                <span>{destinationColor}</span>
              </div>
            </div>

            <div className="form-group">
              <label>Marker Size</label>
              <div className="size-options">
                <button
                  className={`size-option ${destinationSize === 'small' ? 'active' : ''}`}
                  onClick={() => setDestinationSize('small')}
                >
                  Small
                </button>
                <button
                  className={`size-option ${destinationSize === 'medium' ? 'active' : ''}`}
                  onClick={() => setDestinationSize('medium')}
                >
                  Medium
                </button>
                <button
                  className={`size-option ${destinationSize === 'large' ? 'active' : ''}`}
                  onClick={() => setDestinationSize('large')}
                >
                  Large
                </button>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={handleCancelDestination}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSaveDestination}>
                {editingDestinationIndex !== null ? 'Save Changes' : 'Add Destination'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MapView
