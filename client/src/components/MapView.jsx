import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { setDestination } from '../services/socketService'
import 'leaflet/dist/leaflet.css'

function MapClickHandler({ isLeader, selectedMember, onMapClick }) {
  useMapEvents({
    click: (e) => {
      if (isLeader && selectedMember) {
        onMapClick(e.latlng)
      }
    }
  })
  return null
}

function MapView({ members, currentUserId, isLeader, selectedMember, pathsVisible }) {
  const [center, setCenter] = useState([25.2854, 55.3781]) // Dubai default
  const [zoom, setZoom] = useState(13)
  const [hasSetInitialView, setHasSetInitialView] = useState(false)

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
    if (isLeader && selectedMember) {
      setDestination(selectedMember, { lat: latlng.lat, lng: latlng.lng })
    }
  }

  const createCustomIcon = (member) => {
    return L.divIcon({
      className: 'custom-marker',
      html: `<div class="member-icon" style="background-color: ${member.color}; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 18px; color: white; font-weight: bold;">
        ${member.icon}
      </div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    })
  }

  const createDestinationIcon = () => {
    return L.divIcon({
      className: 'destination-marker',
      html: `<div style="background: #ff6b6b; color: white; border: 3px solid white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">📍</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    })
  }

  return (
    <div className="map-container">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler
          isLeader={isLeader}
          selectedMember={selectedMember}
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

        {Object.values(members).map(member => {
          if (!member.destination) return null

          const { lat, lng } = member.destination
          const icon = createDestinationIcon()

          return (
            <Marker
              key={`dest-${member.id}`}
              position={[lat, lng]}
              icon={icon}
            >
              <Popup>
                <strong>Destination for {member.name}</strong>
              </Popup>
            </Marker>
          )
        })}

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
