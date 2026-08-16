// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../services/api/apiService', () => ({
  createEvaluation: vi.fn(),
  updateEvaluation: vi.fn(),
  deleteEvaluation: vi.fn(),
}))

import * as api from '../../../services/api/apiService'
import { useEvaluationStore } from './evaluationStore'

const mockApi = api as Record<string, ReturnType<typeof vi.fn>>

describe('evaluationStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useEvaluationStore.setState({ evaluations: [] })
  })

  it('should initialize with empty evaluations array', () => {
    expect(useEvaluationStore.getState().evaluations).toEqual([])
  })

  it('should manage evaluation state correctly (sync)', () => {
    const evaluation = { id: '1', clientId: 'c1', date: '2026-03-20', weightKg: 75, heightCm: 175, bodyFatPercentage: 15 }
    useEvaluationStore.getState()._addEvaluation(evaluation)
    expect(useEvaluationStore.getState().evaluations).toEqual([evaluation])
  })

  describe('addEvaluation', () => {
    it('should call createEvaluation API and add to store', async () => {
      const evaluation = { id: 'e-1', clientId: 'c1', date: '2025-02-01', weight: 65 }
      mockApi.createEvaluation.mockResolvedValue(evaluation)

      await useEvaluationStore.getState().addEvaluation({ clientId: 'c1', date: '2025-02-01', weight: 65 } as any)

      expect(useEvaluationStore.getState().evaluations).toHaveLength(1)
    })
  })

  describe('updateEvaluation', () => {
    it('should update evaluation in store', async () => {
      useEvaluationStore.setState({ evaluations: [{ id: 'e1', weight: 80 }] as any })
      mockApi.updateEvaluation.mockResolvedValue({ id: 'e1', weight: 75 })

      await useEvaluationStore.getState().updateEvaluation('e1', { weight: 75 } as any)

      expect(useEvaluationStore.getState().evaluations[0].weight).toBe(75)
    })
  })

  describe('deleteEvaluation', () => {
    it('should remove evaluation from store', async () => {
      useEvaluationStore.setState({ evaluations: [{ id: 'e1' }] as any })
      mockApi.deleteEvaluation.mockResolvedValue(undefined)

      await useEvaluationStore.getState().deleteEvaluation('e1')

      expect(useEvaluationStore.getState().evaluations).toHaveLength(0)
    })
  })
})
