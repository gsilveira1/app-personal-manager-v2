// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest'
import { create } from 'zustand'

import { createSystemFeatureSlice, type SystemFeatureSlice } from './systemFeatureSlice'

const createTestStore = () => create<SystemFeatureSlice>()((...a) => ({ ...createSystemFeatureSlice(...a) }))

describe('systemFeatureSlice', () => {
  let store: ReturnType<typeof createTestStore>

  beforeEach(() => {
    store = createTestStore()
  })

  it('should initialize with empty systemFeatures array', () => {
    expect(store.getState().systemFeatures).toEqual([])
  })

  it('_setSystemFeatures should replace entire array', () => {
    const features = [{ id: '1', key: 'ai_insights', name: 'AI Insights', enabled: true }]
    store.getState()._setSystemFeatures(features)
    expect(store.getState().systemFeatures).toEqual(features)
  })

  it('_addSystemFeature should append to array', () => {
    const f1 = { id: '1', key: 'ai_insights', name: 'AI Insights', enabled: true }
    store.getState()._addSystemFeature(f1)
    expect(store.getState().systemFeatures).toHaveLength(1)
  })

  it('_updateSystemFeature should update matching feature', () => {
    const f1 = { id: '1', key: 'ai_insights', name: 'AI Insights', enabled: true }
    store.getState()._setSystemFeatures([f1])

    const updated = { ...f1, enabled: false }
    store.getState()._updateSystemFeature(updated)
    expect(store.getState().systemFeatures[0].enabled).toBe(false)
  })

  it('_removeSystemFeature should filter out by id', () => {
    const f1 = { id: '1', key: 'ai_insights', name: 'AI Insights', enabled: true }
    store.getState()._setSystemFeatures([f1])

    store.getState()._removeSystemFeature('1')
    expect(store.getState().systemFeatures).toHaveLength(0)
  })
})
