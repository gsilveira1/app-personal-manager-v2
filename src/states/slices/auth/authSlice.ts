import { type StateCreator } from 'zustand'

import { type User } from '../../../types'
import * as api from '../../../services/api/apiService'
import { uploadFileToGcs } from '../../../utils/uploadToGcs'

/**
 * Represents the authentication slice of the application state.
 */
export interface AuthSlice {
  /** The currently authenticated user object or null if logged out. */
  user: User | null
  /** Flag indicating whether a valid authentication session exists. */
  isAuthenticated: boolean
  /** Flag indicating whether the authentication status check is currently in progress. */
  isLoading: boolean
  /**
   * Authenticates the user with email and password credentials.
   *
   * @param email - The user's account email address
   * @param pass - The user's account password
   * @returns A promise that resolves when authentication completes
   * @throws {ApiError} If authentication fails on the server
   * @example
   * await login("user@example.com", "secret123");
   */
  login: (email: string, pass: string) => Promise<void>
  /**
   * Registers a new user account and sets current user session.
   *
   * @param name - The full name of the new user
   * @param email - The email address for the new account
   * @param pass - The password for the new account
   * @returns A promise that resolves when registration completes
   * @throws {ApiError} If user registration fails
   * @example
   * await signup("John Doe", "john@example.com", "securepass");
   */
  signup: (name: string, email: string, pass: string) => Promise<void>
  /**
   * Terminates the current user session and resets auth state.
   *
   * @returns A promise that resolves when logout completes
   * @example
   * await logout();
   */
  logout: () => Promise<void>
  /**
   * Checks current authentication status against the backend session.
   *
   * @returns A promise that resolves once auth status is verified
   * @example
   * await checkAuthStatus();
   */
  checkAuthStatus: () => Promise<void>
  /**
   * Updates the logged-in user's profile details.
   *
   * @param updates - Partial object containing updated profile fields
   * @returns A promise resolving when profile update completes
   */
  updateProfile: (updates: Partial<User>) => Promise<void>
  /**
   * Uploads the user avatar photo file to GCS and updates profile state.
   *
   * @param file - Image File object to upload
   * @returns A promise resolving when avatar upload completes
   */
  uploadAvatar: (file: File) => Promise<void>
}

/**
 * Creates the auth slice state creator for Zustand store integration.
 *
 * @param set - Zustand state setter function
 * @param _get - Zustand state getter function
 * @returns Initialized AuthSlice state object and methods
 * @example
 * const slice = createAuthSlice(set, get, storeApi);
 */
export const createAuthSlice: StateCreator<AuthSlice, [], [], AuthSlice> = (set, _get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, pass) => {
    const { user } = await api.login(email, pass)
    set({ user, isAuthenticated: true })
  },

  signup: async (name, email, pass) => {
    const { user } = await api.signup(name, email, pass)
    set({ user, isAuthenticated: true })
  },

  logout: async () => {
    await api.logout()
    set({ user: null, isAuthenticated: false })
  },

  checkAuthStatus: async () => {
    set({ isLoading: true })
    try {
      const user = await api.getCurrentUser()
      if (user) {
        set({ user, isAuthenticated: true })
      } else {
        set({ user: null, isAuthenticated: false })
      }
    } catch (error) {
      console.error('Auth check failed', error)
      set({ user: null, isAuthenticated: false })
    } finally {
      set({ isLoading: false })
    }
  },

  updateProfile: async (updates) => {
    const updatedUser = await api.updateUserProfile(updates)
    set({ user: updatedUser })
  },

  uploadAvatar: async (file) => {
    const { uploadUrl, publicUrl } = await api.getUserAvatarUploadUrl(file.type)
    const localDataUrl = await uploadFileToGcs(uploadUrl, file)
    const avatarUrl = localDataUrl || publicUrl
    const updatedUser = await api.updateUserProfile({ avatar: avatarUrl })
    set({ user: updatedUser })
  },
})
