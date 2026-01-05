import DestinationPath from './DestinationPath'
import { clearDestinationPath } from '../services/socketService'

function LeaderControls({
  destinationPath,
  currentDestinationIndex,
  onTogglePaths,
  pathsVisible,
  onExport
}) {
  const handleClearPath = () => {
    if (window.confirm('Are you sure you want to clear the entire destination path?')) {
      clearDestinationPath()
    }
  }

  return (
    <div className="leader-controls">
      <h3>👑 Leader Controls</h3>

      <div className="form-group">
        <label>📍 Add Destinations</label>
        <small>Click anywhere on the map to add a destination to the route</small>
      </div>

      <div className="path-controls">
        <button className="btn" onClick={onTogglePaths}>
          📊 {pathsVisible ? 'Hide' : 'Show'} Member Paths
        </button>
        <button className="btn btn-secondary" onClick={handleClearPath}>
          🧹 Clear Route
        </button>
      </div>

      <DestinationPath
        destinationPath={destinationPath}
        currentDestinationIndex={currentDestinationIndex}
        onExport={onExport}
      />
    </div>
  )
}

export default LeaderControls
