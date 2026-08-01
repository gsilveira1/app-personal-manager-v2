// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest'
import { create } from 'zustand'

import { createFinanceSlice, type FinanceSlice } from './financeSlice'

const createTestStore = () => create<FinanceSlice>()((...a) => ({ ...createFinanceSlice(...a) }))

describe('financeSlice', () => {
  let store: ReturnType<typeof createTestStore>

  beforeEach(() => {
    store = createTestStore()
  })

  it('should initialize with empty plans array', () => {
    expect(store.getState().plans).toEqual([])
  })

  it('_setPlans should replace entire array', () => {
    const plans = [{ id: '1', name: 'Mensal', price: 150, sessionCount: 4 }]
    store.getState()._setPlans(plans)
    expect(store.getState().plans).toEqual(plans)
  })

  it('_addPlan should append to array', () => {
    const p1 = { id: '1', name: 'Mensal', price: 150, sessionCount: 4 }
    store.getState()._addPlan(p1)
    expect(store.getState().plans).toHaveLength(1)
  })

  it('_updatePlan should update matching plan', () => {
    const p1 = { id: '1', name: 'Mensal', price: 150, sessionCount: 4 }
    store.getState()._setPlans([p1])

    const updated = { ...p1, price: 180 }
    store.getState()._updatePlan(updated)
    expect(store.getState().plans[0].price).toBe(180)
  })

  it('_removePlan should filter out by id', () => {
    const p1 = { id: '1', name: 'Mensal', price: 150, sessionCount: 4 }
    store.getState()._setPlans([p1])

    store.getState()._removePlan('1')
    expect(store.getState().plans).toHaveLength(0)
  })
})
