class Room {
  constructor(code, leaderId, leaderData) {
    this.code = code;
    this.leaderId = leaderId;
    this.createdAt = new Date();
    this.users = new Map();
    this.locations = new Map();
    this.destinations = new Map();
    this.locationHistory = new Map();

    // Add leader to room
    this.users.set(leaderId, {
      id: leaderId,
      ...leaderData,
      isLeader: true,
      joinedAt: new Date()
    });
  }

  addUser(userId, userData) {
    this.users.set(userId, {
      id: userId,
      ...userData,
      isLeader: false,
      joinedAt: new Date()
    });
    this.locationHistory.set(userId, []);
  }

  removeUser(userId) {
    this.users.delete(userId);
    this.locations.delete(userId);
    this.destinations.delete(userId);
    this.locationHistory.delete(userId);
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
      leaderId: this.leaderId,
      createdAt: this.createdAt,
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
