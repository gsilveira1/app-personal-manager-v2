// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../services/api/apiService', () => ({
  createPlan: vi.fn(),
  updatePlan: vi.fn(),
  deletePlan: vi.fn(),
}))

import * as api from '../../../services/api/apiService'
import { useFinanceStore } from './financeStore'

const mockApi = api as Record<string, ReturnType<typeof vi.fn>>

describe('financeStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useFinanceStore.setState({ plans: [] })
  })

  it('should initialize with empty plans array', () => {
    expect(useFinanceStore.getState().plans).toEqual([]  )
  })

  it('should manage finance state correctly (sync)', () => {
    const plan = { id: '1', name: 'Mensal', price: 150, sessionCount: 4 }
    useFinanceStore.getState()._addPlan(plan)
    expect(useFinanceStore.getState().plans).toEqual([plan])
  })

  describe('addPlan', () => {
    it('should call createPlan API and add to store', async () => {
      const plan = { id: 'p-1', type: 'PRESENCIAL', name: 'Básico', sessionsPerWeek: 3, price: 200 }
      mockApi.createPlan.mockResolvedValue(plan)

      await useFinanceStore.getState().addPlan({ type: 'PRESENCIAL', name: 'Básico', sessionsPerWeek: 3, price: 200 } as any)

      expect(useFinanceStore.getState().plans).toHaveLength(1)
    })
  })

  describe('updatePlan', () => {
    it('should update plan in store', async () => {
      useFinanceStore.setState({ plans: [{ id: 'p1', name: 'Old' }] as any })
      mockApi.updatePlan.mockResolvedValue({ id: 'p1', name: 'New' })

      await useFinanceStore.getState().updatePlan('p1', { name: 'New' } as any)

      expect(useFinanceStore.getState().plans[0].name).toBe('New')
    })
  })

  describe('deletePlan', () => {
    it('should call deletePlan API and remove from store', async () => {
      useFinanceStore.setState({ plans: [{ id: 'p-1' }] as any })
      mockApi.deletePlan.mockResolvedValue(undefined)

      await useFinanceStore.getState().deletePlan('p-1', () => ({ clients: [] } as any))

      expect(useFinanceStore.getState().plans).toHaveLength(0)
    })
  })
})
