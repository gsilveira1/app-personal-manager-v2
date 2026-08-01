import { create } from 'zustand'

import { createWorkoutSlice, type WorkoutSlice } from './slices/workout/workoutSlice'

export const useWorkoutStore = create<WorkoutSlice>()((...a) => ({
  ...createWorkoutSlice(...a),
}))

export type { WorkoutSlice }
export { createWorkoutSlice }
