import { type User } from '../../types'
import apiClient from '../../utils/apiClient'

/**
 * Updates the authenticated user's profile details.
 *
 * @param updates - Partial object containing updated profile fields (name, avatar, phone, bio, etc.)
 * @returns The updated User object
 */
export const updateUserProfile = async (updates: Partial<User>): Promise<User> => {
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
