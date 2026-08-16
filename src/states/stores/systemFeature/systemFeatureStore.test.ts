// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../services/api/apiService', () => ({
  getActiveSystemFeatures: vi.fn(),
  createSystemFeature: vi.fn(),
  updateSystemFeature: vi.fn(),
  deleteSystemFeature: vi.fn(),
}))

import * as api from '../../../services/api/apiService'
import { useSystemFeatureStore } from './systemFeatureStore'

const mockApi = api as Record<string, ReturnType<typeof vi.fn>>

describe('systemFeatureStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useSystemFeatureStore.setState({ systemFeatures: [] })
  })

  it('should initialize with empty systemFeatures array', () => {
    expect(useSystemFeatureStore.getState().systemFeatures).toEqual([])
  })

  it('should manage systemFeature state correctly (sync)', () => {
    const feature = { id: '1', key: 'ai_insights', name: 'AI Insights', enabled: true }
    useSystemFeatureStore.getState()._addSystemFeature(feature)
    expect(useSystemFeatureStore.getState().systemFeatures).toEqual([feature])
  })

  describe('fetchSystemFeatures', () => {
    it('should load features from API', async () => {
      mockApi.getActiveSystemFeatures.mockResolvedValue([{ id: 'sf1', key: 'feat' }])

      await useSystemFeatureStore.getState().fetchSystemFeatures()

      expect(useSystemFeatureStore.getState().systemFeatures).toHaveLength(1)
    })
  })

  describe('addSystemFeature', () => {
    it('should create and add feature', async () => {
      mockApi.createSystemFeature.mockResolvedValue({ id: 'sf1', key: 'feat', name: 'Feature' })

      await useSystemFeatureStore.getState().addSystemFeature({ key: 'feat', name: 'Feature' })

      expect(useSystemFeatureStore.getState().systemFeatures).toHaveLength(1)
    })
  })

  describe('updateSystemFeature', () => {
    it('should update existing feature', async () => {
      useSystemFeatureStore.setState({ systemFeatures: [{ id: 'sf1', key: 'old', name: 'Old' }] as any })
      mockApi.updateSystemFeature.mockResolvedValue({ id: 'sf1', key: 'old', name: 'New' })

      await useSystemFeatureStore.getState().updateSystemFeature('sf1', { name: 'New' })

      expect(useSystemFeatureStore.getState().systemFeatures[0].name).toBe('New')
    })
  })

  describe('deleteSystemFeature', () => {
    it('should remove feature from store', async () => {
      useSystemFeatureStore.setState({ systemFeatures: [{ id: 'sf1' }] as any })
      mockApi.deleteSystemFeature.mockResolvedValue(undefined)

      await useSystemFeatureStore.getState().deleteSystemFeature('sf1')

      expect(useSystemFeatureStore.getState().systemFeatures).toHaveLength(0)
    })
  })
})
