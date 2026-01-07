import { useLanguage } from '../contexts/LanguageContext'

function MemberList({ members }) {
  const { t } = useLanguage()

  const getStatusClass = (member) => {
    if (!member.lastSeen) return 'status-offline'
    const timeSinceLastSeen = new Date() - new Date(member.lastSeen)
    return timeSinceLastSeen < 60000 ? 'status-online' : 'status-offline'
  }

  const isPhotoIcon = (icon) => {
    return icon && icon.startsWith('data:image')
  }

  return (
    <div className="member-list">
      <h3>👥 {t('memberList.groupMembers')}</h3>
      <div className="members-container">
        {Object.values(members).map(member => (
          <div key={member.id} className="member-item">
            <div
              className="member-icon"
              style={{ backgroundColor: member.color }}
            >
              {isPhotoIcon(member.icon) ? (
                <img src={member.icon} alt={member.name} className="member-photo" />
              ) : (
                member.icon
              )}
            </div>
            <div className="member-info">
              <div className="member-name">
                {member.name} {member.isLeader ? '👑' : ''}
              </div>
              <div className="member-status">
                {member.location ? t('memberList.locationShared') : t('memberList.noLocation')}
                <span className={`status-indicator ${getStatusClass(member)}`}></span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MemberList
