import { create } from 'zustand'

import { type SystemFeature } from '../types'
import * as api from '../services/api/apiService'
import { createSystemFeatureSlice, type SystemFeatureSlice } from './slices/systemFeature/systemFeatureSlice'

export interface SystemFeatureActions {
  fetchSystemFeatures: () => Promise<void>
  addSystemFeature: (data: { key: string; name: string; description?: string }) => Promise<void>
  updateSystemFeature: (id: string, updates: Partial<SystemFeature>) => Promise<void>
  deleteSystemFeature: (id: string) => Promise<void>
}

export type SystemFeatureStoreState = SystemFeatureSlice & SystemFeatureActions

export const useSystemFeatureStore = create<SystemFeatureStoreState>()((...a) => ({
  ...createSystemFeatureSlice(...a),

  fetchSystemFeatures: async () => {
    const [, get] = [a[0], a[1]]
    const features = await api.getActiveSystemFeatures()
    get()._setSystemFeatures(features || [])
  },

  addSystemFeature: async (data) => {
    const [, get] = [a[0], a[1]]
    const feature = await api.createSystemFeature(data)
    get()._addSystemFeature(feature)
  },

  updateSystemFeature: async (id, updates) => {
    const [, get] = [a[0], a[1]]
    const feature = await api.updateSystemFeature(id, updates)
    get()._updateSystemFeature(feature)
  },

  deleteSystemFeature: async (id) => {
    const [, get] = [a[0], a[1]]
    await api.deleteSystemFeature(id)
    get()._removeSystemFeature(id)
  },
}))

export type { SystemFeatureSlice }
export { createSystemFeatureSlice }
