import { type StateCreator } from 'zustand'

import { type WorkoutPlan } from '../types'
import { type AppState } from './store'

export interface WorkoutSlice {
  workouts: WorkoutPlan[]
  _setWorkouts: (workouts: WorkoutPlan[]) => void
  _addWorkout: (workout: WorkoutPlan) => void
  _updateWorkout: (workout: WorkoutPlan) => void
  _removeWorkout: (workoutId: string) => void
}

export const createWorkoutSlice: StateCreator<AppState, [], [], WorkoutSlice> = (set) => ({
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
