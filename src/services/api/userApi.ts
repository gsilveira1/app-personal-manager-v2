import { type UpdateProfileBody, type User } from '../../types'
import apiClient from '../../utils/apiClient'

export interface CompleteSetupPayload {
  success: boolean
  user: User
}

/**
 * Updates the authenticated user's profile details.
 *
 * @param updates - Fields accepted by `PATCH /users/profile` (name, email, password, avatar, phone, bio, slug)
 * @returns The updated User object
 */
export const updateUserProfile = async (updates: UpdateProfileBody): Promise<User> => {
  const updatedUser = await apiClient<User>('/users/profile', {
    method: 'PATCH',
    body: JSON.stringify(updates),
  })
  localStorage.setItem('user', JSON.stringify(updatedUser))
  return updatedUser
}

/**
 * Requests a signed upload URL for the authenticated user's avatar image.
 *
 * @param contentType - MIME content type of the image file (e.g. "image/png", "image/jpeg")
 * @returns Object containing the signed upload URL and public image URL
 */
export const getUserAvatarUploadUrl = async (contentType: string): Promise<{ uploadUrl: string; publicUrl: string }> => {
  return apiClient<{ uploadUrl: string; publicUrl: string }>('/users/avatar-upload-url', {
    method: 'POST',
    body: JSON.stringify({ contentType }),
  })
}

/**
 * Updates the trainer's branding (logo URL, primary brand colour).
 */
export const updateBranding = async (data: { logoUrl?: string; primaryColor?: string }): Promise<User> =>
  apiClient<User>('/users/branding', {
    method: 'PATCH',
    body: JSON.stringify(data),
  })

/**
 * Completes the setup wizard and unlocks dashboard access.
 */
export const completeSetup = async (): Promise<CompleteSetupPayload> => apiClient<CompleteSetupPayload>('/users/setup/complete', { method: 'POST' })
