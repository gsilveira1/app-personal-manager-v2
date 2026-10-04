import { type DndConfig } from '../../types'
import apiClient from '../../utils/apiClient'

/**
 * Retrieves custom instructions for AI workout generation.
 */
export const getAiInstructions = async () => apiClient<{ instructions: string }>('/settings/ai-instructions')

/**
 * Updates custom instructions for AI workout generation.
 */
export const updateAiInstructions = async (instructions: string) =>
  apiClient<{ instructions: string }>('/settings/ai-instructions', {
    method: 'PUT',
    body: JSON.stringify({ instructions }),
  })

/**
 * Retrieves the preferred locale setting.
 */
export const getLanguage = () => apiClient<{ language: string }>('/settings/language')

/**
 * Updates the preferred locale setting.
 */
export const updateLanguage = (language: string) =>
  apiClient<{ language: string }>('/settings/language', {
    method: 'PATCH',
    body: JSON.stringify({ language }),
  })

/**
 * Updates the do-not-disturb window for queued notifications; the API merges the
 * given keys over the current configuration and returns the whole object.
 */
export const updateDndSettings = (dnd: Partial<DndConfig>) =>
  apiClient<DndConfig>('/settings/dnd', {
    method: 'PATCH',
    body: JSON.stringify(dnd),
  })
