import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockApiClient = vi.fn()

vi.mock('../../utils/apiClient', () => ({
  default: (...args: any[]) => mockApiClient(...args),
}))

import { generateWorkoutPlan, generateWorkoutInsights } from './geminiService'

describe('geminiService (delegating to backend API)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateWorkoutPlan', () => {
    it('calls /ai/workout-plan endpoint with correct payload', async () => {
      const mockResponse = {
        title: 'Strength Program',
        description: 'Full body',
        exercises: [{ name: 'Squat', sets: 3, reps: '10', notes: 'Deep' }],
        tags: ['strength'],
      }
      mockApiClient.mockResolvedValueOnce(mockResponse)

      const params = {
        clientName: 'Carlos',
        goal: 'Hypertrophy',
        experienceLevel: 'Intermediate',
        daysPerWeek: 4,
        limitations: 'Bad shoulder',
      }

      const result = await generateWorkoutPlan(params)

      expect(mockApiClient).toHaveBeenCalledTimes(1)
      expect(mockApiClient).toHaveBeenCalledWith('/ai/workout-plan', {
        method: 'POST',
        body: JSON.stringify(params),
      })
      expect(result).toEqual(mockResponse)
    })

    it('rethrows errors thrown by apiClient', async () => {
      mockApiClient.mockRejectedValueOnce(new Error('Network error'))

      await expect(
        generateWorkoutPlan({
          clientName: 'Test',
          goal: 'Strength',
          experienceLevel: 'Beginner',
          daysPerWeek: 3,
        })
      ).rejects.toThrow('Network error')
    })
  })

  describe('generateWorkoutInsights', () => {
    const baseClient = {
      id: 'c1',
      name: 'Maria',
      email: 'maria@test.com',
      phone: '555',
      status: 'Active' as const,
      type: 'In-Person' as const,
      avatar: null,
      goal: 'Marathon prep',
    }

    it('calls /ai/workout-insights endpoint with correct payload', async () => {
      const mockInsights = {
        insights: [
          {
            suggestion: { name: 'Bulgarian Split Squats', sets: 3, reps: '10-12 per leg' },
            reason: 'Strengthens knee muscles.',
          },
        ],
      }
      mockApiClient.mockResolvedValueOnce(mockInsights)

      const params = {
        client: baseClient as any,
        archivedPlans: [],
      }

      const result = await generateWorkoutInsights(params)

      expect(mockApiClient).toHaveBeenCalledTimes(1)
      expect(mockApiClient).toHaveBeenCalledWith('/ai/workout-insights', {
        method: 'POST',
        body: JSON.stringify(params),
      })
      expect(result).toEqual(mockInsights)
    })

    it('wraps errors with descriptive message', async () => {
      mockApiClient.mockRejectedValueOnce(new Error('API failure'))

      await expect(
        generateWorkoutInsights({
          client: baseClient as any,
          archivedPlans: [],
        })
      ).rejects.toThrow('Failed to get insights from AI. Please check your connection or API key.')
    })
  })
})
