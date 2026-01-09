const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Create admin room
export async function createAdminRoom(roomName, isPublic = true) {
  const response = await fetch(`${API_BASE_URL}/api/admin/rooms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ roomName, isPublic })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create admin room');
  }

  return response.json();
}

// Get all admin rooms
export async function getAdminRooms() {
  const response = await fetch(`${API_BASE_URL}/api/admin/rooms`);

  if (!response.ok) {
    throw new Error('Failed to fetch admin rooms');
  }

  return response.json();
}

// Get public rooms (for user selection)
export async function getPublicRooms() {
  const response = await fetch(`${API_BASE_URL}/api/admin/public-rooms`);

  if (!response.ok) {
    throw new Error('Failed to fetch public rooms');
  }

  return response.json();
}

// Get room details
export async function getRoomDetails(roomCode) {
  const response = await fetch(`${API_BASE_URL}/api/admin/rooms/${roomCode}`);

  if (!response.ok) {
    throw new Error('Failed to fetch room details');
  }

  return response.json();
}

// Update room settings
export async function updateRoom(roomCode, { roomName, isPublic }) {
  const response = await fetch(`${API_BASE_URL}/api/admin/rooms/${roomCode}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ roomName, isPublic })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update room');
  }

  return response.json();
}

// Delete admin room
export async function deleteAdminRoom(roomCode) {
  const response = await fetch(`${API_BASE_URL}/api/admin/rooms/${roomCode}`, {
    method: 'DELETE'
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete room');
  }

  return response.json();
}

// Assign leader to room
export async function assignLeader(roomCode, userId, userName, color, icon) {
  const response = await fetch(`${API_BASE_URL}/api/admin/rooms/${roomCode}/leaders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId, userName, color, icon })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to assign leader');
  }

  return response.json();
}

// Remove leader from room
export async function removeLeader(roomCode, userId) {
  const response = await fetch(`${API_BASE_URL}/api/admin/rooms/${roomCode}/leaders/${userId}`, {
    method: 'DELETE'
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to remove leader');
  }

  return response.json();
}

// Remove user from room completely
export async function removeUser(roomCode, userId) {
  const response = await fetch(`${API_BASE_URL}/api/admin/rooms/${roomCode}/users/${userId}`, {
    method: 'DELETE'
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to remove user');
  }

  return response.json();
}

// Upload GPX file to replace destination path
export async function uploadGPX(roomCode, file) {
  const formData = new FormData();
  formData.append('gpxFile', file);

  const response = await fetch(`${API_BASE_URL}/api/admin/rooms/${roomCode}/upload-gpx`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to upload GPX file');
  }

  return response.json();
}
