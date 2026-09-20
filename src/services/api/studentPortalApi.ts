import apiClient from '../../utils/apiClient'
import type { WorkoutSheet } from '../../types'

export interface PortalWorkoutSheetResponse {
  sheetId: string | null
  sheetName: string
  trainerName?: string
  trainerPhone?: string
  workouts: Array<{
    id: string
    letter: string
    name: string
    blocks: Array<{
      id: string
      type: 'REGULAR' | 'BISET' | 'TRISET'
      restTimeSeconds: number
      exercises: Array<{
        workoutExerciseId: string
        exerciseName: string
        gifUrl: string
        sets: number
        reps: string
        executionNotes?: string
        lastLoadKg: number | null
      }>
    }>
  }>
}

export const getPortalWorkoutSheet = async (token: string): Promise<PortalWorkoutSheetResponse> => {
  return apiClient<PortalWorkoutSheetResponse>(`/student/workout-sheet?token=${encodeURIComponent(token)}`)
}

export const recordPortalSession = async (
  token: string,
  data: {
    workoutId: string
    durationSeconds: number
    completedAt?: string
    loads?: Array<{ workoutExerciseId: string; loadKg: number }>
  },
): Promise<{ message: string; sessionId: string; durationSeconds: number }> => {
  return apiClient<{ message: string; sessionId: string; durationSeconds: number }>(
    `/student/sessions?token=${encodeURIComponent(token)}`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
  )
}
