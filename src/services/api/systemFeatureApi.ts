import { type SystemFeature } from '../../types'
import apiClient from '../../utils/apiClient'

/**
 * Retrieves all system features.
 */
export const getSystemFeatures = async () => apiClient<SystemFeature[]>('/system-features')

/**
 * Retrieves active system features.
 */
export const getActiveSystemFeatures = async () => apiClient<SystemFeature[]>('/system-features/active')

/**
 * Creates a new system feature.
 */
export const createSystemFeature = async (data: { key: string; name: string; description?: string }) =>
  apiClient<SystemFeature>('/system-features', {
    method: 'POST',
    body: JSON.stringify(data),
  })

/**
 * Updates an existing system feature.
 */
export const updateSystemFeature = async (id: string, updates: Partial<SystemFeature>) =>
  apiClient<SystemFeature>(`/system-features/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  })

/**
 * Deletes a system feature.
 */
export const deleteSystemFeature = async (id: string) =>
  apiClient<void>(`/system-features/${id}`, {
    method: 'DELETE',
  })
