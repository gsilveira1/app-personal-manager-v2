// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest'

import { useWorkoutStore } from './workoutStore'

describe('workoutStore', () => {
  beforeEach(() => {
    useWorkoutStore.setState({ workouts: [] })
  })

  it('should initialize with empty workouts array', () => {
    expect(useWorkoutStore.getState().workouts).toEqual([])
  })

  it('should manage workout state correctly', () => {
    const workout = { id: '1', title: 'Treino A', exercises: [], createdAt: '2026-03-20' }
    useWorkoutStore.getState()._addWorkout(workout)
    expect(useWorkoutStore.getState().workouts).toEqual([workout])
  })
})
