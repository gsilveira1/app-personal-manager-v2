// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('./store', () => ({}))

import { createSystemFeatureSlice, type SystemFeatureSlice } from './systemFeatureSlice'
import type { SystemFeature } from '../types'

const createTestStore = () => {
  let state: SystemFeatureSlice = {} as SystemFeatureSlice
  const set = (partial: Partial<SystemFeatureSlice> | ((s: SystemFeatureSlice) => Partial<SystemFeatureSlice>)) => {
    if (typeof partial === 'function') {
      state = { ...state, ...partial(state) }
    } else {
      state = { ...state, ...partial }
    }
  }
  const get = () => state
  state = createSystemFeatureSlice(set as any, get as any, {} as any)
  return { getState: () => state }
}

const featureA: SystemFeature = {
  id: 'feat-1',
  key: 'ai_workout',
  name: 'AI Workout Generator',
  description: 'Generate workouts with AI',
  isActive: true,
}

const featureB: SystemFeature = {
  id: 'feat-2',
  key: 'pix_payments',
  name: 'PIX Payments',
  isActive: false,
}

describe('systemFeatureSlice', () => {
  let store: ReturnType<typeof createTestStore>

  beforeEach(() => {
    store = createTestStore()
  })

  it('should initialize with empty systemFeatures array', () => {
    expect(store.getState().systemFeatures).toEqual([])
  })

  it('_setSystemFeatures should replace entire array', () => {
    store.getState()._setSystemFeatures([featureA, featureB])
    expect(store.getState().systemFeatures).toEqual([featureA, featureB])
  })

  it('_addSystemFeature should append to array', () => {
    store.getState()._addSystemFeature(featureA)
    expect(store.getState().systemFeatures).toHaveLength(1)

    store.getState()._addSystemFeature(featureB)
    expect(store.getState().systemFeatures).toHaveLength(2)
    expect(store.getState().systemFeatures[1].key).toBe('pix_payments')
  })

  it('_updateSystemFeature should replace matching feature by id', () => {
    store.getState()._setSystemFeatures([featureA, featureB])

    const updated = { ...featureA, name: 'AI Workout V2', isActive: false }
    store.getState()._updateSystemFeature(updated)

    expect(store.getState().systemFeatures[0].name).toBe('AI Workout V2')
    expect(store.getState().systemFeatures[0].isActive).toBe(false)
    expect(store.getState().systemFeatures[1]).toEqual(featureB)
  })

  it('_removeSystemFeature should filter out by id', () => {
    store.getState()._setSystemFeatures([featureA, featureB])

    store.getState()._removeSystemFeature('feat-1')

    expect(store.getState().systemFeatures).toHaveLength(1)
    expect(store.getState().systemFeatures[0].id).toBe('feat-2')
  })
})
