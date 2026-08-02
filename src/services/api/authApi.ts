import { type User } from '../../types'
import apiClient from '../../utils/apiClient'

/**
 * Logs in a user using email and password, storing credentials.
 */
export const login = async (email: string, pass: string) => {
  const data = await apiClient<{ user: User; access_token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password: pass }),
  })
  localStorage.setItem('token', data.access_token)
  localStorage.setItem('user', JSON.stringify(data.user))
  return { user: data.user, token: data.access_token }
}

/**
 * Registers a new user, storing credentials.
 */
export const signup = async (name: string, email: string, pass: string) => {
  const data = await apiClient<{ user: User; access_token: string }>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ name, email, password: pass }),
  })
  localStorage.setItem('token', data.access_token)
  localStorage.setItem('user', JSON.stringify(data.user))
  return { user: data.user, token: data.access_token }
}

/**
 * Logs out the current user, clearing stored credentials.
 */
export const logout = async () => {
  await apiClient('/auth/logout', { method: 'POST' })
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

/**
 * Gets details of the currently authenticated user.
 */
export const getCurrentUser = async () => {
  const token = localStorage.getItem('token')
  if (!token) return null
  try {
    return await apiClient<User>('/auth/me')
  } catch (error) {
    console.error('Failed to get current user:', error)
    return null
  }
}

/**
 * Requests a password reset for a given email.
 */
export const requestPasswordReset = async (email: string) => {
  return await apiClient<void>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}
