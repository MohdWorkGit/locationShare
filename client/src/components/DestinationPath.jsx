import { removeDestinationFromPath, setCurrentDestinationIndex } from '../services/socketService'

function DestinationPath({ destinationPath, currentDestinationIndex, onRemoveDestination, onExport }) {
  const handleSetCurrent = (index) => {
    setCurrentDestinationIndex(index)
  }

  const handleRemove = (index) => {
    if (window.confirm('Are you sure you want to remove this destination?')) {
      removeDestinationFromPath(index)
    }
  }

  const handleExport = (format) => {
    onExport(format)
  }

  if (!destinationPath || destinationPath.length === 0) {
    return (
      <div className="destination-path">
        <h3>📍 Destination Route</h3>
        <p className="empty-state">No destinations added yet. Click on the map to add destinations.</p>
      </div>
    )
  }

  return (
    <div className="destination-path">
      <h3>📍 Destination Route ({destinationPath.length})</h3>
      <div className="destination-list">
        {destinationPath.map((dest, index) => (
          <div
            key={index}
            className={`destination-item ${index === currentDestinationIndex ? 'current' : ''} ${index < currentDestinationIndex ? 'visited' : ''}`}
          >
            <div className="destination-number">
              {index < currentDestinationIndex ? '✓' : index + 1}
            </div>
            <div className="destination-info">
              <div className="destination-coords">
                {dest.lat.toFixed(5)}, {dest.lng.toFixed(5)}
              </div>
              <div className="destination-time">
                {new Date(dest.addedAt).toLocaleTimeString()}
              </div>
            </div>
            <div className="destination-actions">
              {index === currentDestinationIndex && (
                <span className="current-badge">Current</span>
              )}
              {index > currentDestinationIndex && (
                <button
                  className="btn-action"
                  onClick={() => handleSetCurrent(index)}
                  title="Set as current destination"
                >
                  →
                </button>
              )}
              <button
                className="btn-action btn-remove"
                onClick={() => handleRemove(index)}
                title="Remove destination"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="export-controls">
        <h4>Export Route</h4>
        <div className="export-buttons">
          <button className="btn-export" onClick={() => handleExport('json')}>
            📄 JSON
          </button>
          <button className="btn-export" onClick={() => handleExport('gpx')}>
            🗺️ GPX
          </button>
          <button className="btn-export" onClick={() => handleExport('csv')}>
            📊 CSV
          </button>
        </div>
      </div>
    </div>
  )
}

export default DestinationPath
