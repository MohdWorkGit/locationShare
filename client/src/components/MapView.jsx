import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { addDestinationToPath } from '../services/socketService'
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

function MapView({ members, currentUserId, isLeader, pathsVisible, destinationPath, currentDestinationIndex }) {
  const [center, setCenter] = useState([25.2854, 55.3781]) // Dubai default
  const [zoom, setZoom] = useState(13)
  const [hasSetInitialView, setHasSetInitialView] = useState(false)
  const [mapType, setMapType] = useState('street') // street or satellite

  // Set initial view to current user's location
  useEffect(() => {
    if (!hasSetInitialView && members[currentUserId]?.location) {
      const { lat, lng } = members[currentUserId].location
      setCenter([lat, lng])
      setZoom(15)
      setHasSetInitialView(true)
    }
  }, [members, currentUserId, hasSetInitialView])

  const handleMapClick = (latlng) => {
    if (isLeader) {
      addDestinationToPath({ lat: latlng.lat, lng: latlng.lng })
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
    let content = number // Always show number for old destinations

    // Use leader's icon/photo ONLY for current destination
    if (isCurrent && leaderIcon) {
      const isPhoto = isPhotoIcon(leaderIcon)
      content = isPhoto
        ? `<img src="${leaderIcon}" alt="Leader" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" />`
        : leaderIcon
    }

    const size = isCurrent ? 50 : 35
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
      {/* Map Type Toggle */}
      <button
        className="map-toggle-btn"
        onClick={() => setMapType(mapType === 'street' ? 'satellite' : 'street')}
        title={`Switch to ${mapType === 'street' ? 'satellite' : 'street'} view`}
      >
        {mapType === 'street' ? '🛰️' : '🗺️'}
      </button>

      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          key={mapType}
          attribution={getTileLayerAttribution()}
          url={getTileLayerUrl()}
        />

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
                <small>Last seen: {new Date(member.lastSeen).toLocaleTimeString()}</small>
                {accuracy && <><br /><small>Accuracy: {Math.round(accuracy)}m</small></>}
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
            >
              <Popup>
                <strong>Destination {index + 1}</strong>
                {isCurrent && <><br /><span style="color: #ff9800;">Current Destination</span></>}
                {isVisited && <><br /><span style="color: #4caf50;">Completed</span></>}
                <br />
                <small>{dest.lat.toFixed(5)}, {dest.lng.toFixed(5)}</small>
                <br />
                <small>Added: {new Date(dest.addedAt).toLocaleTimeString()}</small>
              </Popup>
            </Marker>
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
