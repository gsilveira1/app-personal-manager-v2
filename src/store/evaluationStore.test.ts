// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest'

import { useEvaluationStore } from './evaluationStore'

describe('evaluationStore', () => {
  beforeEach(() => {
    useEvaluationStore.setState({ evaluations: [] })
  })

  it('should initialize with empty evaluations array', () => {
    expect(useEvaluationStore.getState().evaluations).toEqual([])
  })

  it('should manage evaluation state correctly', () => {
    const evaluation = { id: '1', clientId: 'c1', date: '2026-03-20', weightKg: 75, heightCm: 175, bodyFatPercentage: 15 }
    useEvaluationStore.getState()._addEvaluation(evaluation)
    expect(useEvaluationStore.getState().evaluations).toEqual([evaluation])
  })
})
