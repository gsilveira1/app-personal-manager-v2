// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest'
import { create } from 'zustand'

import { createWorkoutSlice, type WorkoutSlice } from './workoutSlice'

const createTestStore = () => create<WorkoutSlice>()((...a) => ({ ...createWorkoutSlice(...a) }))

describe('workoutSlice', () => {
  let store: ReturnType<typeof createTestStore>

  beforeEach(() => {
    store = createTestStore()
  })

  it('should initialize with empty workouts array', () => {
    expect(store.getState().workouts).toEqual([])
  })

  it('_setWorkouts should replace entire array', () => {
    const workouts = [{ id: '1', title: 'Hipertrofia A', exercises: [], createdAt: '2026-03-20' }]
    store.getState()._setWorkouts(workouts)
    expect(store.getState().workouts).toEqual(workouts)
  })

  it('_addWorkout should append to array', () => {
    const w1 = { id: '1', title: 'Treino A', exercises: [], createdAt: '2026-03-20' }
    store.getState()._addWorkout(w1)
    expect(store.getState().workouts).toHaveLength(1)
  })

  it('_updateWorkout should update matching workout', () => {
    const w1 = { id: '1', title: 'Treino A', exercises: [], createdAt: '2026-03-20' }
    store.getState()._setWorkouts([w1])

    const updated = { ...w1, title: 'Treino A - Modificado' }
    store.getState()._updateWorkout(updated)
    expect(store.getState().workouts[0].title).toBe('Treino A - Modificado')
  })

  it('_removeWorkout should filter out by id', () => {
    const w1 = { id: '1', title: 'Treino A', exercises: [], createdAt: '2026-03-20' }
    store.getState()._setWorkouts([w1])

    store.getState()._removeWorkout('1')
    expect(store.getState().workouts).toHaveLength(0)
  })
})
