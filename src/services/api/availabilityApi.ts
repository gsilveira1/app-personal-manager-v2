import { type WorkHoursConfig, type AvailabilityBlock, type MaterializedBlock } from '../../types'
import apiClient from '../../utils/apiClient'

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
export const getAvailabilityBlocks = (start: Date, end: Date) => apiClient<MaterializedBlock[]>(`/availability-blocks?start=${start.toISOString()}&end=${end.toISOString()}`)

/**
 * Creates a new availability block.
 */
export const createAvailabilityBlock = (data: Omit<AvailabilityBlock, 'id'>) =>
  apiClient<AvailabilityBlock>('/availability-blocks', {
    method: 'POST',
    body: JSON.stringify(data),
  })

/**
 * Updates an existing availability block.
 */
export const updateAvailabilityBlock = (id: string, data: Partial<AvailabilityBlock>) =>
  apiClient<AvailabilityBlock>(`/availability-blocks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })

/**
 * Deletes an availability block.
 */
export const deleteAvailabilityBlock = (id: string) =>
  apiClient<void>(`/availability-blocks/${id}`, {
    method: 'DELETE',
  })
