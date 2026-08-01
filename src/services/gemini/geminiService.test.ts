import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockGenerateContent } = vi.hoisted(() => {
  const mockGenerateContent = vi.fn()
  return { mockGenerateContent }
})

vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = { generateContent: mockGenerateContent }
  },
  Type: { OBJECT: 'OBJECT', STRING: 'STRING', NUMBER: 'NUMBER', ARRAY: 'ARRAY', BOOLEAN: 'BOOLEAN' },
}))

import { generateWorkoutPlan, generateWorkoutInsights } from './geminiService'
// buildMedicalHistoryContext is not exported, so we test it indirectly
// We need to access it through the module internals or test via generateWorkoutPlan

// Since buildMedicalHistoryContext is not exported, we re-import the module to test it.
// We'll use a workaround: dynamically import and extract it.
import * as geminiModule from './geminiService'

// Helper to get the non-exported function via module internals
// We'll test it indirectly through the API calls, but also directly by importing the module source.
// Actually, let's check if it is exported...
// Looking at the source, buildMedicalHistoryContext is a plain function (not exported).
// We test it indirectly through generateWorkoutPlan and generateWorkoutInsights.

describe('geminiService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('buildMedicalHistoryContext (tested indirectly)', () => {
    it('returns "Nenhum historico" context when client has no medical history', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({
          title: 'Test Plan',
          description: 'A test',
          exercises: [],
          tags: [],
        }),
      })

      await generateWorkoutPlan({
        clientName: 'Test',
        goal: 'Strength',
        experienceLevel: 'Beginner',
        daysPerWeek: 3,
        client: {
          id: 'c1',
          name: 'Test Client',
          email: 'test@test.com',
          phone: '555',
          status: 'Active' as const,
          type: 'In-Person' as const,
          avatar: null,
          // no medicalHistory
        } as any,
      })

      const callArgs = mockGenerateContent.mock.calls[0][0]
      expect(callArgs.contents).toContain('Nenhum histórico médico registrado.')
    })

    it('builds correct string with all medical history fields', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({
          title: 'Test Plan',
          description: 'A test',
          exercises: [],
          tags: [],
        }),
      })

      await generateWorkoutPlan({
        clientName: 'Test',
        goal: 'Strength',
        experienceLevel: 'Beginner',
        daysPerWeek: 3,
        client: {
          id: 'c1',
          name: 'Test Client',
          email: 'test@test.com',
          phone: '555',
          status: 'Active' as const,
          type: 'In-Person' as const,
          avatar: null,
          medicalHistory: {
            objective: ['Health', 'Aesthetics'],
            injuries: 'Bad knee',
            surgeries: 'ACL repair',
            medications: 'Ibuprofen',
            hasHeartDisease: true,
            smoker: true,
            drinker: true,
            observations: 'Careful with squats',
          },
        } as any,
      })

      const callArgs = mockGenerateContent.mock.calls[0][0]
      const prompt = callArgs.contents as string
      expect(prompt).toContain('Objetivos: Health, Aesthetics')
      expect(prompt).toContain('Lesões: Bad knee')
      expect(prompt).toContain('Cirurgias: ACL repair')
      expect(prompt).toContain('Medicamentos: Ibuprofen')
      expect(prompt).toContain('Doença cardíaca: Sim')
      expect(prompt).toContain('Fumante: Sim')
      expect(prompt).toContain('Consome álcool: Sim')
      expect(prompt).toContain('Observações: Careful with squats')
    })
  })

  describe('generateWorkoutPlan', () => {
    it('calls API with correct prompt and returns parsed response', async () => {
      const mockResponse = {
        title: 'Strength Program',
        description: 'Full body',
        exercises: [{ name: 'Squat', sets: 3, reps: '10', notes: 'Deep' }],
        tags: ['strength'],
      }
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockResponse),
      })

      const result = await generateWorkoutPlan({
        clientName: 'Carlos',
        goal: 'Hypertrophy',
        experienceLevel: 'Intermediate',
        daysPerWeek: 4,
        limitations: 'Bad shoulder',
      })

      expect(mockGenerateContent).toHaveBeenCalledTimes(1)
      const callArgs = mockGenerateContent.mock.calls[0][0]
      expect(callArgs.model).toBe('gemini-3-pro-preview')
      expect(callArgs.contents).toContain('Carlos')
      expect(callArgs.contents).toContain('Hypertrophy')
      expect(callArgs.contents).toContain('Intermediate')
      expect(callArgs.contents).toContain('Bad shoulder')
      expect(callArgs.contents).toContain('4 days per week')
      expect(callArgs.config.responseMimeType).toBe('application/json')
      expect(result).toEqual(mockResponse)
    })

    it('handles API error gracefully by rethrowing', async () => {
      const apiError = new Error('API rate limit exceeded')
      mockGenerateContent.mockRejectedValue(apiError)

      await expect(
        generateWorkoutPlan({
          clientName: 'Test',
          goal: 'Strength',
          experienceLevel: 'Beginner',
          daysPerWeek: 3,
        })
      ).rejects.toThrow('API rate limit exceeded')
    })

    it('throws when API returns empty text', async () => {
      mockGenerateContent.mockResolvedValue({ text: '' })

      await expect(
        generateWorkoutPlan({
          clientName: 'Test',
          goal: 'Strength',
          experienceLevel: 'Beginner',
          daysPerWeek: 3,
        })
      ).rejects.toThrow('Received an empty response from the AI.')
    })

    it('includes custom instructions when provided', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({ title: 'Plan', description: '', exercises: [], tags: [] }),
      })

      await generateWorkoutPlan({
        clientName: 'Test',
        goal: 'Weight loss',
        experienceLevel: 'Beginner',
        daysPerWeek: 3,
        customInstructions: 'Focus on compound movements only.',
      })

      const callArgs = mockGenerateContent.mock.calls[0][0]
      expect(callArgs.contents).toContain('Focus on compound movements only.')
      // Should NOT contain the default persona prompt when custom instructions provided
      expect(callArgs.contents).not.toContain('Você é um personal trainer experiente')
    })

    it('uses default persona prompt when no custom instructions', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({ title: 'Plan', description: '', exercises: [], tags: [] }),
      })

      await generateWorkoutPlan({
        clientName: 'Test',
        goal: 'Strength',
        experienceLevel: 'Beginner',
        daysPerWeek: 3,
      })

      const callArgs = mockGenerateContent.mock.calls[0][0]
      expect(callArgs.contents).toContain('Você é um personal trainer experiente')
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
      notes: 'Dedicated runner',
      dateOfBirth: '1990-05-10',
    }

    it('calls API and returns insights', async () => {
      const mockInsights = {
        insights: [
          {
            suggestion: { name: 'Bulgarian Split Squats', sets: 3, reps: '10-12 per leg', notes: 'Focus on stability.' },
            reason: 'Strengthens muscles around the knee.',
          },
        ],
      }
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify(mockInsights),
      })

      const result = await generateWorkoutInsights({
        client: baseClient as any,
        latestEvaluation: { id: 'e1', clientId: 'c1', date: '2026-01-01', weight: 70, bodyFatPercentage: 15, notes: 'Good progress' } as any,
        archivedPlans: [
          { id: 'w1', title: 'Old Plan', description: 'Previous workout', exercises: [], tags: [], createdAt: '2025-01-01', status: 'Archived' as const },
        ],
      })

      expect(mockGenerateContent).toHaveBeenCalledTimes(1)
      const callArgs = mockGenerateContent.mock.calls[0][0]
      expect(callArgs.contents).toContain('Maria')
      expect(callArgs.contents).toContain('Marathon prep')
      expect(callArgs.contents).toContain('Old Plan')
      expect(callArgs.config.responseMimeType).toBe('application/json')
      expect(result).toEqual(mockInsights)
    })

    it('handles API error with descriptive message', async () => {
      mockGenerateContent.mockRejectedValue(new Error('Network error'))

      await expect(
        generateWorkoutInsights({
          client: baseClient as any,
          archivedPlans: [],
        })
      ).rejects.toThrow('Failed to get insights from AI. Please check your connection or API key.')
    })

    it('throws when API returns empty text', async () => {
      mockGenerateContent.mockResolvedValue({ text: '' })

      await expect(
        generateWorkoutInsights({
          client: baseClient as any,
          archivedPlans: [],
        })
      ).rejects.toThrow('Failed to get insights from AI. Please check your connection or API key.')
    })

    it('includes custom instructions when provided', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({ insights: [] }),
      })

      await generateWorkoutInsights({
        client: baseClient as any,
        archivedPlans: [],
        customInstructions: 'Only suggest bodyweight exercises.',
      })

      const callArgs = mockGenerateContent.mock.calls[0][0]
      expect(callArgs.contents).toContain('Only suggest bodyweight exercises.')
    })

    it('handles no archived plans gracefully', async () => {
      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({ insights: [] }),
      })

      await generateWorkoutInsights({
        client: baseClient as any,
        archivedPlans: [],
      })

      const callArgs = mockGenerateContent.mock.calls[0][0]
      expect(callArgs.contents).toContain('No past plans available.')
    })
  })
})
