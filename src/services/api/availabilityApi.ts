import { type WorkHoursConfig, type AvailabilityBlock, type MaterializedBlock } from '../../types'
import apiClient from '../../utils/apiClient'

/** The properties the availability-block writes accept; the API rejects any other. */
const BLOCK_KEYS = ['title', 'dtstart', 'dtend', 'rrule', 'timezone', 'notes'] as const

/**
 * View model → request body. On create, empty values are left out. On update a
 * `null` is kept, because it is how a rule or a note is cleared.
 */
export const toBlockBody = (block: Partial<AvailabilityBlock>, keepNulls = false): Record<string, unknown> => {
  const body: Record<string, unknown> = {}
  for (const key of BLOCK_KEYS) {
    const value = block[key]
    if (value === undefined) continue
    if (value === null && !keepNulls) continue
    body[key] = value
  }
  return body
}

/**
 * Retrieves the work hours configuration.
 */
export const getWorkHours = () => apiClient<WorkHoursConfig>('/settings/work-hours')

/**
 * Updates the work hours configuration.
 */
export const updateWorkHours = (config: WorkHoursConfig) =>
  apiClient<WorkHoursConfig>('/settings/work-hours', {
    method: 'PUT',
    body: JSON.stringify(config),
  })

/**
 * Retrieves availability blocks within a date range.
 */
export const getAvailabilityBlocks = (start: Date, end: Date) =>
  apiClient<MaterializedBlock[]>(`/availability-blocks?start=${encodeURIComponent(start.toISOString())}&end=${encodeURIComponent(end.toISOString())}`)

/**
 * Creates a new availability block.
 */
export const createAvailabilityBlock = (data: Omit<AvailabilityBlock, 'id'>) =>
  apiClient<AvailabilityBlock>('/availability-blocks', {
    method: 'POST',
    body: JSON.stringify(toBlockBody(data)),
  })

/**
 * Updates an existing availability block.
 */
export const updateAvailabilityBlock = (id: string, data: Partial<AvailabilityBlock>) =>
  apiClient<AvailabilityBlock>(`/availability-blocks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(toBlockBody(data, true)),
  })

/**
 * Deletes an availability block. The API answers with the deleted block.
 */
export const deleteAvailabilityBlock = (id: string) =>
  apiClient<AvailabilityBlock>(`/availability-blocks/${id}`, {
    method: 'DELETE',
  })
