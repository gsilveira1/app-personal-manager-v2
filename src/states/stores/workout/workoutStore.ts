import { create } from 'zustand'
import { type StateCreator } from 'zustand'

import { type WorkoutPlan } from '../../../types'
import * as api from '../../../services/api/apiService'
import { createWorkoutSlice, type WorkoutSlice } from '../../slices/workout/workoutSlice'

/**
 * Async API actions domain interface for workout plans management.
 */
export interface WorkoutActions {
  /**
   * Creates a new workout plan on backend and state.
   * 
   * @param workout - Workout data omitting generated ID and creation date
   * @returns A promise resolving when workout plan creation completes
   */
  addWorkout: (workout: Omit<WorkoutPlan, 'id' | 'createdAt'>) => Promise<void>
  /**
   * Updates an existing workout plan.
   * 
   * @param id - Unique identifier of workout plan
   * @param workout - Partial workout properties to update
   * @returns A promise resolving when workout plan update completes
   */
  updateWorkout: (id: string, workout: Partial<WorkoutPlan>) => Promise<void>
  /**
   * Deletes a workout plan by ID.
   * 
   * @param id - Unique identifier of workout plan to delete
   * @returns A promise resolving when deletion completes
   */
  deleteWorkout: (id: string) => Promise<void>
}

/** Composite state type combining WorkoutSlice and WorkoutActions. */
export type WorkoutStoreState = WorkoutSlice & WorkoutActions

/**
 * Single source of truth for all workout async actions.
 * Consumed by both useWorkoutStore (standalone) and useStore (global).
 * 
 * @param set - Zustand state setter function
 * @param get - Zustand state getter function
 * @returns Object containing workout async action implementations
 */
export const createWorkoutActions: StateCreator<WorkoutStoreState, [], [], WorkoutActions> = (set, get) => ({
  addWorkout: async (workoutData) => {
    const newWorkout = await api.createWorkout(workoutData)
    get()._addWorkout(newWorkout)
  },

  updateWorkout: async (id, updates) => {
    const updatedWorkout = await api.updateWorkout(id, updates)
    get()._updateWorkout(updatedWorkout)
  },

  deleteWorkout: async (id) => {
    await api.deleteWorkout(id)
    get()._removeWorkout(id)
  },
})

/**
 * Zustand hook for managing workout state and actions.
 * 
 * @example
 * const { workouts, addWorkout } = useWorkoutStore();
 */
export const useWorkoutStore = create<WorkoutStoreState>()((...a) => ({
  ...createWorkoutSlice(...a),
  ...createWorkoutActions(...a),
}))

export type { WorkoutSlice }
export { createWorkoutSlice }
