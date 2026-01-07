import { removeDestinationFromPath } from '../services/socketService'
import { useLanguage } from '../contexts/LanguageContext'

function DestinationPath({ destinationPath, currentDestinationIndex, onRemoveDestination, onExport, onEditDestination }) {
  const { t } = useLanguage()

  const handleRemove = (index) => {
    if (window.confirm(t('destinationPath.confirmRemove'))) {
      removeDestinationFromPath(index)
    }
  }

  const handleExport = (format) => {
    onExport(format)
  }

  if (!destinationPath || destinationPath.length === 0) {
    return (
      <div className="destination-path">
        <h3>📍 {t('leader.destinationRoute')}</h3>
        <p className="empty-state">{t('leader.noDestinations')}</p>
      </div>
    )
  }

  return (
    <div className="destination-path">
      <h3>📍 {t('leader.destinationRoute')} ({destinationPath.length})</h3>
      <div className="destination-list">
        {destinationPath.map((dest, index) => (
          <div
            key={index}
            className={`destination-item ${index === currentDestinationIndex ? 'current' : ''} ${index < currentDestinationIndex ? 'visited' : ''}`}
          >
            <div className="destination-number">
              {index + 1}
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
                <span className="current-badge">{t('leader.current')}</span>
              )}
              {onEditDestination && (
                <button
                  className="btn-action btn-edit"
                  onClick={() => onEditDestination(index)}
                  title={t('destinationPath.editDestination') || 'Edit destination'}
                >
                  ✏️
                </button>
              )}
              <button
                className="btn-action btn-remove"
                onClick={() => handleRemove(index)}
                title={t('destinationPath.removeDestination')}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="export-controls">
        <h4>{t('leader.exportRoute')}</h4>
        <div className="export-buttons">
          <button className="btn-export" onClick={() => handleExport('json')}>
            📄 {t('export.json')}
          </button>
          <button className="btn-export" onClick={() => handleExport('gpx')}>
            🗺️ {t('export.gpx')}
          </button>
          <button className="btn-export" onClick={() => handleExport('csv')}>
            📊 {t('export.csv')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DestinationPath
