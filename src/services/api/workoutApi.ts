import { type WorkoutPlan } from '../../types'
import apiClient from '../../utils/apiClient'

/**
 * Retrieves all workout plans.
 */
export const getWorkouts = async () => apiClient<WorkoutPlan[]>('/workouts')

/**
 * Creates a new workout plan.
 */
export const createWorkout = async (workout: Omit<WorkoutPlan, 'id' | 'createdAt'>) =>
  apiClient<WorkoutPlan>('/workouts', {
    method: 'POST',
    body: JSON.stringify(workout),
  })

/**
 * Updates an existing workout plan.
 */
export const updateWorkout = async (id: string, updates: Partial<WorkoutPlan>) =>
  apiClient<WorkoutPlan>(`/workouts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  })

/**
 * Deletes a workout plan.
 */
export const deleteWorkout = async (id: string) =>
  apiClient<void>(`/workouts/${id}`, {
    method: 'DELETE',
  })
