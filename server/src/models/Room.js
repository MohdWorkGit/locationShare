class Room {
  constructor(code, leaderId, leaderData, options = {}) {
    this.code = code;
    this.leaderIds = new Set([leaderId]); // Support multiple leaders
    this.isAdminCreated = options.isAdminCreated || false;
    this.isPublic = options.isPublic || false;
    this.roomName = options.roomName || `Room ${code}`;
    this.createdAt = new Date();
    this.lastActivity = new Date();
    this.users = new Map();
    this.locations = new Map();
    this.destinations = new Map();
    this.locationHistory = new Map();

    // Global destination path for all users
    this.destinationPath = [];
    this.currentDestinationIndex = 0;

    // Add initial leader to room
    this.users.set(leaderId, {
      id: leaderId,
      ...leaderData,
      isLeader: true,
      joinedAt: new Date(),
      online: true
    });
  }

  // Check if user is a leader
  isLeader(userId) {
    return this.leaderIds.has(userId);
  }

  // Add a leader to the room
  addLeader(userId) {
    this.leaderIds.add(userId);
    const user = this.users.get(userId);
    if (user) {
      user.isLeader = true;
    }
    this.lastActivity = new Date();
  }

  // Remove a leader from the room
  removeLeader(userId) {
    if (this.leaderIds.size > 1) { // Keep at least one leader
      this.leaderIds.delete(userId);
      const user = this.users.get(userId);
      if (user) {
        user.isLeader = false;
      }
      this.lastActivity = new Date();
      return true;
    }
    return false;
  }

  // Get all leader IDs
  getLeaderIds() {
    return Array.from(this.leaderIds);
  }

  addUser(userId, userData) {
    this.users.set(userId, {
      id: userId,
      ...userData,
      isLeader: false,
      joinedAt: new Date(),
      online: true
    });
    this.locationHistory.set(userId, []);
    this.lastActivity = new Date();
  }

  // Find user by name (for reconnection)
  findUserByName(name) {
    for (const [userId, user] of this.users.entries()) {
      if (user.name === name) {
        return { userId, user };
      }
    }
    return null;
  }

  // Reconnect existing user
  reconnectUser(userId, newSocketId) {
    const user = this.users.get(userId);
    if (user) {
      user.online = true;
      user.reconnectedAt = new Date();
      this.lastActivity = new Date();
      return true;
    }
    return false;
  }

  // Mark user as offline (instead of removing)
  markUserOffline(userId) {
    const user = this.users.get(userId);
    if (user) {
      user.online = false;
      user.disconnectedAt = new Date();
      this.lastActivity = new Date();
    }
  }

  // Remove user completely (for cleanup)
  removeUser(userId) {
    this.users.delete(userId);
    this.locations.delete(userId);
    this.destinations.delete(userId);
    this.locationHistory.delete(userId);
  }

  // Get online users count
  getOnlineUsersCount() {
    return Array.from(this.users.values()).filter(u => u.online).length;
  }

  // Check if room should be deleted (no online users for extended period)
  shouldBeDeleted(inactiveTimeMs = 24 * 60 * 60 * 1000) { // 24 hours default
    const onlineUsers = this.getOnlineUsersCount();
    if (onlineUsers > 0) return false;

    const now = new Date();
    return (now - this.lastActivity) > inactiveTimeMs;
  }

  updateLocation(userId, location) {
    this.locations.set(userId, {
      ...location,
      timestamp: new Date()
    });

    // Add to location history
    if (!this.locationHistory.has(userId)) {
      this.locationHistory.set(userId, []);
    }

    const history = this.locationHistory.get(userId);
    history.push({
      ...location,
      timestamp: new Date()
    });

    // Keep only last 50 locations
    if (history.length > 50) {
      this.locationHistory.set(userId, history.slice(-50));
    }
  }

  setDestination(userId, destination) {
    this.destinations.set(userId, {
      ...destination,
      setAt: new Date()
    });
  }

  removeDestination(userId) {
    this.destinations.delete(userId);
  }

  // Global destination path methods
  addDestinationToPath(destination) {
    this.destinationPath.push({
      ...destination,
      addedAt: new Date(),
      order: this.destinationPath.length
    });
    const newIndex = this.destinationPath.length - 1;
    // Automatically set the new destination as current
    this.currentDestinationIndex = newIndex;
    return newIndex;
  }

  removeDestinationFromPath(index) {
    if (index >= 0 && index < this.destinationPath.length) {
      this.destinationPath.splice(index, 1);
      // Reorder remaining destinations
      this.destinationPath.forEach((dest, i) => {
        dest.order = i;
      });
    }
  }

  clearDestinationPath() {
    this.destinationPath = [];
    this.currentDestinationIndex = 0;
  }

  getDestinationPath() {
    return this.destinationPath;
  }

  setCurrentDestinationIndex(index) {
    if (index >= 0 && index < this.destinationPath.length) {
      this.currentDestinationIndex = index;
    }
  }

  getCurrentDestination() {
    if (this.currentDestinationIndex < this.destinationPath.length) {
      return this.destinationPath[this.currentDestinationIndex];
    }
    return null;
  }

  getUser(userId) {
    return this.users.get(userId);
  }

  getLocation(userId) {
    return this.locations.get(userId);
  }

  getDestination(userId) {
    return this.destinations.get(userId);
  }

  getLocationHistory(userId, timeRange = 3600000) {
    const history = this.locationHistory.get(userId) || [];
    const cutoffTime = new Date(Date.now() - timeRange);
    return history.filter(loc => new Date(loc.timestamp) > cutoffTime);
  }

  getAllUsers() {
    return Array.from(this.users.values());
  }

  toJSON() {
    return {
      code: this.code,
      leaderIds: Array.from(this.leaderIds),
      isAdminCreated: this.isAdminCreated,
      isPublic: this.isPublic,
      roomName: this.roomName,
      createdAt: this.createdAt,
      destinationPath: this.destinationPath,
      currentDestinationIndex: this.currentDestinationIndex,
      users: Array.from(this.users.entries()).map(([id, user]) => ({
        id,
        ...user,
        location: this.locations.get(id),
        destination: this.destinations.get(id)
      }))
    };
  }
}

module.exports = Room;
