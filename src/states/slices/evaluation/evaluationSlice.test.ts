// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest'
import { create } from 'zustand'

import { createEvaluationSlice, type EvaluationSlice } from './evaluationSlice'

const createTestStore = () => create<EvaluationSlice>()((...a) => ({ ...createEvaluationSlice(...a) }))

describe('evaluationSlice', () => {
  let store: ReturnType<typeof createTestStore>

  beforeEach(() => {
    store = createTestStore()
  })

  it('should initialize with empty evaluations array', () => {
    expect(store.getState().evaluations).toEqual([])
  })

  it('_setEvaluations should replace entire array', () => {
    const evaluations = [{ id: '1', clientId: 'c1', date: '2026-03-20', weightKg: 75, heightCm: 175, bodyFatPercentage: 15 }]
    store.getState()._setEvaluations(evaluations)
    expect(store.getState().evaluations).toEqual(evaluations)
  })

  it('_addEvaluation should prepends to array', () => {
    const e1 = { id: '1', clientId: 'c1', date: '2026-03-20', weightKg: 75, heightCm: 175, bodyFatPercentage: 15 }
    store.getState()._addEvaluation(e1)
    expect(store.getState().evaluations).toHaveLength(1)
  })

  it('_updateEvaluation should update matching evaluation', () => {
    const e1 = { id: '1', clientId: 'c1', date: '2026-03-20', weightKg: 75, heightCm: 175, bodyFatPercentage: 15 }
    store.getState()._setEvaluations([e1])

    const updated = { ...e1, weightKg: 74 }
    store.getState()._updateEvaluation(updated)
    expect(store.getState().evaluations[0].weightKg).toBe(74)
  })

  it('_removeEvaluation should filter out by id', () => {
    const e1 = { id: '1', clientId: 'c1', date: '2026-03-20', weightKg: 75, heightCm: 175, bodyFatPercentage: 15 }
    store.getState()._setEvaluations([e1])

    store.getState()._removeEvaluation('1')
    expect(store.getState().evaluations).toHaveLength(0)
  })
})
