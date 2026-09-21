import apiClient from '../../utils/apiClient'
import type { WorkoutSheet, WorkoutTemplate } from '../../types'

export const createWorkoutSheet = async (studentId: string, data: any): Promise<WorkoutSheet> => {
  return apiClient<WorkoutSheet>(`/students/${studentId}/workout-sheets`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export const getWorkoutSheets = async (studentId: string): Promise<WorkoutSheet[]> => {
  return apiClient<WorkoutSheet[]>(`/students/${studentId}/workout-sheets`)
}

export const getWorkoutSheet = async (id: string): Promise<WorkoutSheet> => {
  return apiClient<WorkoutSheet>(`/workout-sheets/${id}`)
}

export const saveWorkoutTemplate = async (sheetId: string, data: { name: string; description?: string }): Promise<WorkoutTemplate> => {
  return apiClient<WorkoutTemplate>(`/workout-templates/from-sheet/${sheetId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export const getWorkoutTemplates = async (): Promise<WorkoutTemplate[]> => {
  return apiClient<WorkoutTemplate[]>('/workout-templates')
}
