// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest'

import { useFinanceStore } from './financeStore'

describe('financeStore', () => {
  beforeEach(() => {
    useFinanceStore.setState({ plans: [] })
  })

  it('should initialize with empty plans array', () => {
    expect(useFinanceStore.getState().plans).toEqual([])
  })

  it('should manage finance state correctly', () => {
    const plan = { id: '1', name: 'Mensal', price: 150, sessionCount: 4 }
    useFinanceStore.getState()._addPlan(plan)
    expect(useFinanceStore.getState().plans).toEqual([plan])
  })
})
