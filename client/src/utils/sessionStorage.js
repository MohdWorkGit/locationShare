// Utility functions for managing room session data in localStorage

const SESSION_KEY = 'locationShare_session'

/**
 * Save the current room session to localStorage
 * @param {Object} session - The session data to save
 * @param {Object} session.room - The room data
 * @param {Object} session.user - The user data
 * @param {boolean} session.isLeader - Whether the user is a leader
 */
export const saveSession = (session) => {
  try {
    const sessionData = {
      room: {
        code: session.room.code,
        name: session.room.name,
        createdAt: session.room.createdAt
      },
      user: {
        id: session.user.id,
        name: session.user.name,
        color: session.user.color,
        icon: session.user.icon,
        isLeader: session.user.isLeader
      },
      isLeader: session.isLeader,
      savedAt: new Date().toISOString()
    }

    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData))
    console.log('Session saved to localStorage:', sessionData)
  } catch (error) {
    console.error('Failed to save session to localStorage:', error)
  }
}

/**
 * Get the saved session from localStorage
 * @returns {Object|null} The saved session data or null if none exists
 */
export const getSession = () => {
  try {
    const sessionData = localStorage.getItem(SESSION_KEY)
    if (sessionData) {
      const parsed = JSON.parse(sessionData)
      console.log('Session retrieved from localStorage:', parsed)
      return parsed
    }
  } catch (error) {
    console.error('Failed to retrieve session from localStorage:', error)
  }
  return null
}

/**
 * Clear the saved session from localStorage
 */
export const clearSession = () => {
  try {
    localStorage.removeItem(SESSION_KEY)
    console.log('Session cleared from localStorage')
  } catch (error) {
    console.error('Failed to clear session from localStorage:', error)
  }
}

/**
 * Check if a session exists in localStorage
 * @returns {boolean} True if a session exists, false otherwise
 */
export const hasSession = () => {
  try {
    return localStorage.getItem(SESSION_KEY) !== null
  } catch (error) {
    console.error('Failed to check session in localStorage:', error)
    return false
  }
}
