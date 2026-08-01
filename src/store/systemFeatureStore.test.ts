// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest'

import { useSystemFeatureStore } from './systemFeatureStore'

describe('systemFeatureStore', () => {
  beforeEach(() => {
    useSystemFeatureStore.setState({ systemFeatures: [] })
  })

  it('should initialize with empty systemFeatures array', () => {
    expect(useSystemFeatureStore.getState().systemFeatures).toEqual([])
  })

  it('should manage systemFeature state correctly', () => {
    const feature = { id: '1', key: 'ai_insights', name: 'AI Insights', enabled: true }
    useSystemFeatureStore.getState()._addSystemFeature(feature)
    expect(useSystemFeatureStore.getState().systemFeatures).toEqual([feature])
  })
})
