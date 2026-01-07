import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import { addDestinationToPath } from '../services/socketService'
import { useLanguage } from '../contexts/LanguageContext'
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

function MapView({ members, currentUserId, isLeader, pathsVisible, destinationPath, currentDestinationIndex, sidebarCollapsed }) {
  const { t } = useLanguage()
  const [center, setCenter] = useState([25.2854, 55.3781]) // Dubai default
  const [zoom, setZoom] = useState(13)
  const [hasSetInitialView, setHasSetInitialView] = useState(false)
  const [mapType, setMapType] = useState('street') // street or satellite
  const [trackingMode, setTrackingMode] = useState('user') // 'none', 'user', 'destination'
  const mapRef = useRef(null)

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
      addDestinationToPath({ lat: latlng.lat, lng: latlng.lng })
    }
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

    return L.divIcon({
      className: 'custom-marker',
      html: `<div class="member-icon" style="background-color: ${member.color}; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 18px; color: white; font-weight: bold; overflow: hidden;">
        ${iconContent}
      </div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    })
  }

  const createDestinationIcon = (number, isCurrent, isVisited, leaderIcon) => {
    const bgColor = isVisited ? '#9e9e9e' : isCurrent ? '#ff9800' : '#ff6b6b'
    let content = '' // No content for old destinations - just empty markers

    // Use leader's icon/photo ONLY for current destination
    if (isCurrent && leaderIcon) {
      const isPhoto = isPhotoIcon(leaderIcon)
      content = isPhoto
        ? `<img src="${leaderIcon}" alt="Leader" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" />`
        : leaderIcon
    }

    const size = isCurrent ? 50 : 20
    const iconSize = [size, size]
    const iconAnchor = [size / 2, size / 2]

    return L.divIcon({
      className: 'destination-marker',
      html: `<div style="background: ${bgColor}; color: white; border: 3px solid white; border-radius: 50%; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center; font-weight: bold; box-shadow: 0 2px 8px rgba(0,0,0,0.3); font-size: ${isCurrent ? '24px' : '16px'}; overflow: hidden;">
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
      >
        <TileLayer
          key={mapType}
          attribution={getTileLayerAttribution()}
          url={getTileLayerUrl()}
        />

        <MapController mapRef={mapRef} />

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
          const icon = createDestinationIcon(index + 1, isCurrent, isVisited, leaderIcon)

          return (
            <Marker
              key={`dest-${index}`}
              position={[dest.lat, dest.lng]}
              icon={icon}
              eventHandlers={{}}
              interactive={false}
            />
          )
        })}

        {/* Destination Path Polyline */}
        {destinationPath && destinationPath.length > 1 && (
          <Polyline
            positions={destinationPath.map(d => [d.lat, d.lng])}
            color="#2196F3"
            weight={4}
            opacity={0.8}
            dashArray="10, 5"
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
              weight={3}
              opacity={0.7}
            />
          )
        })}
      </MapContainer>
    </div>
  )
}

export default MapView
