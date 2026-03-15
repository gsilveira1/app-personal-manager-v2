// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('./store', () => ({}))

import { createFinanceSlice, type FinanceSlice } from './financeSlice'
import { type Plan } from '../types'

const createTestStore = () => {
  let state: FinanceSlice = {} as FinanceSlice
  const set = (partial: Partial<FinanceSlice> | ((s: FinanceSlice) => Partial<FinanceSlice>)) => {
    if (typeof partial === 'function') {
      state = { ...state, ...partial(state) }
    } else {
      state = { ...state, ...partial }
    }
  }
  const get = () => state
  state = createFinanceSlice(set as any, get as any, {} as any)
  return { getState: () => state }
}

const makePlan = (id: string): Plan => ({
  id,
  type: 'PRESENCIAL',
  name: `Plano ${id}`,
  sessionsPerWeek: 3,
  price: 200,
})

describe('financeSlice', () => {
  let store: ReturnType<typeof createTestStore>

  beforeEach(() => {
    store = createTestStore()
  })

  it('should initialize with empty plans array', () => {
    expect(store.getState().plans).toEqual([])
  })

  it('_setPlans should replace entire array', () => {
    store.getState()._setPlans([makePlan('1'), makePlan('2')])
    expect(store.getState().plans).toHaveLength(2)
  })

  it('_addPlan should append', () => {
    store.getState()._addPlan(makePlan('1'))
    expect(store.getState().plans).toHaveLength(1)
  })

  it('_updatePlan should replace matching by id', () => {
    store.getState()._setPlans([makePlan('1')])
    store.getState()._updatePlan({ ...makePlan('1'), price: 300 })
    expect(store.getState().plans[0].price).toBe(300)
  })

  it('_removePlan should filter out by id', () => {
    store.getState()._setPlans([makePlan('1'), makePlan('2')])
    store.getState()._removePlan('1')
    expect(store.getState().plans).toHaveLength(1)
    expect(store.getState().plans[0].id).toBe('2')
  })
})
