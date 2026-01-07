import DestinationPath from './DestinationPath'
import { clearDestinationPath } from '../services/socketService'
import { useLanguage } from '../contexts/LanguageContext'

function LeaderControls({
  destinationPath,
  currentDestinationIndex,
  onTogglePaths,
  pathsVisible,
  onExport
}) {
  const { t } = useLanguage()

  const handleClearPath = () => {
    if (window.confirm(t('leader.confirmClearPath'))) {
      clearDestinationPath()
    }
  }

  return (
    <div className="leader-controls">
      <h3>👑 {t('leader.controls')}</h3>

      <div className="form-group">
        <label>📍 {t('leader.addDestinations')}</label>
        <small>{t('leader.addDestinationsHint')}</small>
      </div>

      <div className="path-controls">
        <button className="btn" onClick={onTogglePaths}>
          📊 {pathsVisible ? t('leader.hidePaths') : t('leader.showPaths')} {t('leader.memberPaths')}
        </button>
        <button className="btn btn-secondary" onClick={handleClearPath}>
          🧹 {t('leader.clearRoute')}
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
