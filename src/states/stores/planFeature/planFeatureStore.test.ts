// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../services/api/apiService', () => ({
  getPlanFeatures: vi.fn(),
}))

import * as api from '../../../services/api/apiService'
import { usePlanFeatureStore } from './planFeatureStore'

const mockApi = api as unknown as Record<string, ReturnType<typeof vi.fn>>

describe('planFeatureStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    usePlanFeatureStore.setState({ planFeatures: [] })
  })

  it('starts with an empty catalogue', () => {
    expect(usePlanFeatureStore.getState().planFeatures).toEqual([])
  })

  it('fetchPlanFeatures stores the catalogue the API returns', async () => {
    const catalogue = [{ key: 'automated_pix', name: 'PIX automático', description: 'Cobrança recorrente' }]
    mockApi.getPlanFeatures.mockResolvedValue(catalogue)

    await usePlanFeatureStore.getState().fetchPlanFeatures()

    expect(usePlanFeatureStore.getState().planFeatures).toEqual(catalogue)
  })

  it('lets a failed load reach the caller and keeps the previous catalogue', async () => {
    usePlanFeatureStore.setState({ planFeatures: [{ key: 'automated_pix', name: 'PIX', description: '' }] })
    mockApi.getPlanFeatures.mockRejectedValue(new Error('offline'))

    await expect(usePlanFeatureStore.getState().fetchPlanFeatures()).rejects.toThrow('offline')
    expect(usePlanFeatureStore.getState().planFeatures).toHaveLength(1)
  })

  it('exposes no write action: the catalogue is defined by the API', () => {
    const state = usePlanFeatureStore.getState() as unknown as Record<string, unknown>
    for (const removed of ['addSystemFeature', 'updateSystemFeature', 'deleteSystemFeature']) expect(state[removed]).toBeUndefined()
  })
})
