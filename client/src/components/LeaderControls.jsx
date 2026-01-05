function LeaderControls({
  members,
  selectedMember,
  onMemberSelect,
  onTogglePaths,
  onClearPaths,
  pathsVisible
}) {
  const memberList = Object.values(members).filter(m => !m.isLeader)

  return (
    <div className="leader-controls">
      <h3>👑 Leader Controls</h3>

      <div className="form-group">
        <label>📍 Assign Destination</label>
        <div className="assign-destination">
          <select
            value={selectedMember}
            onChange={(e) => onMemberSelect(e.target.value)}
          >
            <option value="">Select member...</option>
            {memberList.map(member => (
              <option key={member.id} value={member.id}>
                {member.name} {member.icon}
              </option>
            ))}
          </select>
        </div>
        <small>Click on the map to set a destination for the selected member</small>
      </div>

      <div className="path-controls">
        <button className="btn" onClick={onTogglePaths}>
          📊 {pathsVisible ? 'Hide' : 'Show'} Path History
        </button>
        <button className="btn btn-secondary" onClick={onClearPaths}>
          🧹 Clear All Paths
        </button>
      </div>
    </div>
  )
}

export default LeaderControls
