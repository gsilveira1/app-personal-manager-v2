import apiClient from '../../utils/apiClient'
import type { ExpiringSheet, WorkoutSheet, WorkoutSheetBody, WorkoutTemplate } from '../../types'
import { buildStructure, toSheetBody, toWorkoutSheet } from './mappers/workoutMapper'

/**
 * Creates a client's workout sheet. The new sheet becomes the active one: the
 * client's previous active sheet is deactivated in the same transaction.
 */
export const createWorkoutSheet = async (clientId: string, data: WorkoutSheetBody): Promise<WorkoutSheet> =>
  toWorkoutSheet(
    await apiClient<WorkoutSheet>(`/clients/${clientId}/workout-sheets`, {
      method: 'POST',
      body: JSON.stringify(toSheetBody(data)),
    })
  )

/**
 * Retrieves the workout sheets of a client, newest first.
 */
export const getWorkoutSheets = async (clientId: string): Promise<WorkoutSheet[]> => (await apiClient<WorkoutSheet[]>(`/clients/${clientId}/workout-sheets`)).map(toWorkoutSheet)

/**
 * Retrieves one workout sheet or template.
 */
export const getWorkoutSheet = async (id: string): Promise<WorkoutSheet> => toWorkoutSheet(await apiClient<WorkoutSheet>(`/workout-sheets/${id}`))

/**
 * Updates a workout sheet or template. `workouts`, when given, replaces the whole
 * structure, so it must carry the ids of the entries that are kept.
 */
export const updateWorkoutSheet = async (id: string, updates: Partial<Omit<WorkoutSheetBody, 'expiresAt'>> & { expiresAt?: string | null }): Promise<WorkoutSheet> => {
  const { workouts, ...rest } = updates
  const body = workouts ? { ...rest, workouts: buildStructure(workouts) } : rest
  return toWorkoutSheet(await apiClient<WorkoutSheet>(`/workout-sheets/${id}`, { method: 'PATCH', body: JSON.stringify(body) }))
}

/**
 * Deletes a workout sheet or template.
 */
export const deleteWorkoutSheet = async (id: string): Promise<{ message: string }> => apiClient<{ message: string }>(`/workout-sheets/${id}`, { method: 'DELETE' })

/**
 * Active sheets of live clients that expire within the next 5 days.
 */
export const getExpiringWorkoutSheets = async (): Promise<ExpiringSheet[]> => apiClient<ExpiringSheet[]>('/workout-sheets/expiring')

/**
 * Saves a copy of a sheet as a template.
 */
export const saveWorkoutTemplate = async (sheetId: string, data: { name: string; description?: string }): Promise<WorkoutTemplate> =>
  toWorkoutSheet(
    await apiClient<WorkoutTemplate>(`/workout-templates/from-sheet/${sheetId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  )

/**
 * Retrieves the trainer's templates, newest first.
 */
export const getWorkoutTemplates = async (): Promise<WorkoutTemplate[]> => (await apiClient<WorkoutTemplate[]>('/workout-templates')).map(toWorkoutSheet)

/**
 * Creates a template from scratch.
 */
export const createWorkoutTemplate = async (data: Omit<WorkoutSheetBody, 'expiresAt'>): Promise<WorkoutTemplate> =>
  toWorkoutSheet(
    await apiClient<WorkoutTemplate>('/workout-templates', {
      method: 'POST',
      body: JSON.stringify(toSheetBody(data)),
    })
  )
