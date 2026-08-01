// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../services/api/apiService', () => ({
  createWorkout: vi.fn(),
  updateWorkout: vi.fn(),
  deleteWorkout: vi.fn(),
}))

import * as api from '../services/api/apiService'
import { useWorkoutStore } from './workoutStore'

const mockApi = api as Record<string, ReturnType<typeof vi.fn>>

describe('workoutStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useWorkoutStore.setState({ workouts: [] })
  })

  it('should initialize with empty workouts array', () => {
    expect(useWorkoutStore.getState().workouts).toEqual([])
  })

  it('should manage workout state correctly (sync)', () => {
    const workout = { id: '1', title: 'Treino A', exercises: [], createdAt: '2026-03-20' }
    useWorkoutStore.getState()._addWorkout(workout)
    expect(useWorkoutStore.getState().workouts).toEqual([workout])
  })

  describe('addWorkout', () => {
    it('should call createWorkout API and add to store', async () => {
      const workout = { id: 'w-1', title: 'Treino A', exercises: [], tags: [] }
      mockApi.createWorkout.mockResolvedValue(workout)

      await useWorkoutStore.getState().addWorkout({ title: 'Treino A', exercises: [], tags: [] } as any)

      expect(useWorkoutStore.getState().workouts).toHaveLength(1)
    })
  })

  describe('updateWorkout', () => {
    it('should update workout in store', async () => {
      useWorkoutStore.setState({ workouts: [{ id: 'w1', name: 'Old' }] as any })
      mockApi.updateWorkout.mockResolvedValue({ id: 'w1', name: 'New' })

      await useWorkoutStore.getState().updateWorkout('w1', { name: 'New' } as any)

      expect(useWorkoutStore.getState().workouts[0].name).toBe('New')
    })
  })

  describe('deleteWorkout', () => {
    it('should call deleteWorkout API and remove from store', async () => {
      useWorkoutStore.setState({ workouts: [{ id: 'w-1' }] as any })
      mockApi.deleteWorkout.mockResolvedValue(undefined)

      await useWorkoutStore.getState().deleteWorkout('w-1')

      expect(useWorkoutStore.getState().workouts).toHaveLength(0)
    })
  })
})
