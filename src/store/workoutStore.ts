import { create } from 'zustand'

import { type WorkoutPlan } from '../types'
import * as api from '../services/api/apiService'
import { createWorkoutSlice, type WorkoutSlice } from './slices/workout/workoutSlice'

export interface WorkoutActions {
  addWorkout: (workout: Omit<WorkoutPlan, 'id' | 'createdAt'>) => Promise<void>
  updateWorkout: (id: string, workout: Partial<WorkoutPlan>) => Promise<void>
  deleteWorkout: (id: string) => Promise<void>
}

export type WorkoutStoreState = WorkoutSlice & WorkoutActions

export const useWorkoutStore = create<WorkoutStoreState>()((...a) => ({
  ...createWorkoutSlice(...a),

  addWorkout: async (workoutData) => {
    const [, get] = [a[0], a[1]]
    const newWorkout = await api.createWorkout(workoutData)
    get()._addWorkout(newWorkout)
  },

  updateWorkout: async (id, updates) => {
    const [, get] = [a[0], a[1]]
    const updatedWorkout = await api.updateWorkout(id, updates)
    get()._updateWorkout(updatedWorkout)
  },

  deleteWorkout: async (id) => {
    const [, get] = [a[0], a[1]]
    await api.deleteWorkout(id)
    get()._removeWorkout(id)
  },
}))

export type { WorkoutSlice }
export { createWorkoutSlice }
