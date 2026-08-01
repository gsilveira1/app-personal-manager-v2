import { create } from 'zustand'

import { createSystemFeatureSlice, type SystemFeatureSlice } from './slices/systemFeature/systemFeatureSlice'

export const useSystemFeatureStore = create<SystemFeatureSlice>()((...a) => ({
  ...createSystemFeatureSlice(...a),
}))

export type { SystemFeatureSlice }
export { createSystemFeatureSlice }
