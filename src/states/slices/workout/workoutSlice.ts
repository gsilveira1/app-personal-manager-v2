import { type StateCreator } from 'zustand'

import { type WorkoutPlan } from '../../../types'

/**
 * Slice managing workout plans state and synchronous mutations.
 */
export interface WorkoutSlice {
  /** Array of active workout plans. */
  workouts: WorkoutPlan[]
  /**
   * Sets the array of workout plans in state.
   * 
   * @param workouts - Array of WorkoutPlan objects
   */
  _setWorkouts: (workouts: WorkoutPlan[]) => void
  /**
   * Appends a new workout plan to state.
   * 
   * @param workout - The new WorkoutPlan object to add
   */
  _addWorkout: (workout: WorkoutPlan) => void
  /**
   * Updates an existing workout plan by ID in state.
   * 
   * @param workout - The updated WorkoutPlan object
   */
  _updateWorkout: (workout: WorkoutPlan) => void
  /**
   * Removes a workout plan from state by ID.
   * 
   * @param workoutId - Unique identifier of workout plan to remove
   */
  _removeWorkout: (workoutId: string) => void
}

/**
 * Creates the workout slice state creator for Zustand store integration.
 * 
 * @param set - Zustand state setter function
 * @returns Initialized WorkoutSlice state object and methods
 * @example
 * const slice = createWorkoutSlice(set, get, storeApi);
 */
export const createWorkoutSlice: StateCreator<WorkoutSlice, [], [], WorkoutSlice> = (set) => ({
  workouts: [],
  _setWorkouts: (workouts) => set({ workouts }),
  _addWorkout: (workout) => set((state) => ({ workouts: [...state.workouts, workout] })),
  _updateWorkout: (workout) =>
    set((state) => ({
      workouts: state.workouts.map((w) => (w.id === workout.id ? workout : w)),
    })),
  _removeWorkout: (workoutId) =>
    set((state) => ({
      workouts: state.workouts.filter((w) => w.id !== workoutId),
    })),
})
