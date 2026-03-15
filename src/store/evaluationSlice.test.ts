// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('./store', () => ({}))

import { createEvaluationSlice, type EvaluationSlice } from './evaluationSlice'
import { type Evaluation } from '../types'

const createTestStore = () => {
  let state: EvaluationSlice = {} as EvaluationSlice
  const set = (partial: Partial<EvaluationSlice> | ((s: EvaluationSlice) => Partial<EvaluationSlice>)) => {
    if (typeof partial === 'function') {
      state = { ...state, ...partial(state) }
    } else {
      state = { ...state, ...partial }
    }
  }
  const get = () => state
  state = createEvaluationSlice(set as any, get as any, {} as any)
  return { getState: () => state }
}

const makeEvaluation = (id: string): Evaluation => ({
  id,
  clientId: 'client-1',
  date: '2025-02-01',
  weight: 65,
})

describe('evaluationSlice', () => {
  let store: ReturnType<typeof createTestStore>

  beforeEach(() => {
    store = createTestStore()
  })

  it('should initialize with empty evaluations array', () => {
    expect(store.getState().evaluations).toEqual([])
  })

  it('_setEvaluations should replace entire array', () => {
    store.getState()._setEvaluations([makeEvaluation('1'), makeEvaluation('2')])
    expect(store.getState().evaluations).toHaveLength(2)
  })

  it('_addEvaluation should prepend (newest first)', () => {
    store.getState()._setEvaluations([makeEvaluation('1')])
    store.getState()._addEvaluation(makeEvaluation('2'))
    expect(store.getState().evaluations[0].id).toBe('2')
    expect(store.getState().evaluations).toHaveLength(2)
  })

  it('_updateEvaluation should replace matching by id', () => {
    store.getState()._setEvaluations([makeEvaluation('1')])
    store.getState()._updateEvaluation({ ...makeEvaluation('1'), weight: 64 })
    expect(store.getState().evaluations[0].weight).toBe(64)
  })

  it('_removeEvaluation should filter out by id', () => {
    store.getState()._setEvaluations([makeEvaluation('1'), makeEvaluation('2')])
    store.getState()._removeEvaluation('1')
    expect(store.getState().evaluations).toHaveLength(1)
    expect(store.getState().evaluations[0].id).toBe('2')
  })
})
