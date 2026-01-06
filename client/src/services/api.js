import axios from 'axios'

// Use environment variable or fallback to relative URL for nginx proxy
const API_BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

export const createRoom = async (name, color, icon) => {
  try {
    const response = await api.post('/rooms', { name, color, icon })
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to create room')
  }
}

export const joinRoom = async (roomCode, name, color, icon) => {
  try {
    const response = await api.post(`/rooms/${roomCode}/join`, { name, color, icon })
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to join room')
  }
}

export const getRoom = async (roomCode) => {
  try {
    const response = await api.get(`/rooms/${roomCode}`)
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to get room')
  }
}

export const leaveRoom = async (roomCode, userId) => {
  try {
    const response = await api.post(`/rooms/${roomCode}/leave`, { userId })
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to leave room')
  }
}

export default api
