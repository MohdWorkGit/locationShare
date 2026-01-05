function MemberList({ members }) {
  const getStatusClass = (member) => {
    if (!member.lastSeen) return 'status-offline'
    const timeSinceLastSeen = new Date() - new Date(member.lastSeen)
    return timeSinceLastSeen < 60000 ? 'status-online' : 'status-offline'
  }

  return (
    <div className="member-list">
      <h3>👥 Group Members</h3>
      <div className="members-container">
        {Object.values(members).map(member => (
          <div key={member.id} className="member-item">
            <div
              className="member-icon"
              style={{ backgroundColor: member.color }}
            >
              {member.icon}
            </div>
            <div className="member-info">
              <div className="member-name">
                {member.name} {member.isLeader ? '👑' : ''}
              </div>
              <div className="member-status">
                {member.location ? 'Location shared' : 'No location'}
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
