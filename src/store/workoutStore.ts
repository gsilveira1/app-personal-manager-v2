import { create } from 'zustand'
import { type StateCreator } from 'zustand'

import { type WorkoutPlan } from '../types'
import * as api from '../services/api/apiService'
import { createWorkoutSlice, type WorkoutSlice } from './slices/workout/workoutSlice'

export interface WorkoutActions {
  addWorkout: (workout: Omit<WorkoutPlan, 'id' | 'createdAt'>) => Promise<void>
  updateWorkout: (id: string, workout: Partial<WorkoutPlan>) => Promise<void>
  deleteWorkout: (id: string) => Promise<void>
}

export type WorkoutStoreState = WorkoutSlice & WorkoutActions

// Single source of truth for all workout async actions.
// Consumed by both useWorkoutStore (standalone) and useStore (global).
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

export const useWorkoutStore = create<WorkoutStoreState>()((...a) => ({
  ...createWorkoutSlice(...a),
  ...createWorkoutActions(...a),
}))

export type { WorkoutSlice }
export { createWorkoutSlice }
