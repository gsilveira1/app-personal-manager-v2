import { create } from 'zustand'

import { type AvailabilityBlock, type WorkHoursConfig } from '../types'
import * as api from '../services/api/apiService'
import { createAvailabilitySlice, type AvailabilitySlice } from './slices/availability/availabilitySlice'

export interface AvailabilityActions {
  updateWorkHours: (config: WorkHoursConfig) => Promise<void>
  fetchAvailabilityBlocks: (start: Date, end: Date) => Promise<void>
  addAvailabilityBlock: (data: Omit<AvailabilityBlock, 'id'>) => Promise<void>
  updateAvailabilityBlock: (id: string, data: Partial<AvailabilityBlock>) => Promise<void>
  deleteAvailabilityBlock: (id: string) => Promise<void>
}

export type AvailabilityStoreState = AvailabilitySlice & AvailabilityActions

export const useAvailabilityStore = create<AvailabilityStoreState>()((...a) => ({
  ...createAvailabilitySlice(...a),

  updateWorkHours: async (config) => {
    const [, get] = [a[0], a[1]]
    const result = await api.updateWorkHours(config)
    get()._setWorkHours(result)
  },

  fetchAvailabilityBlocks: async (start, end) => {
    const [, get] = [a[0], a[1]]
    const blocks = await api.getAvailabilityBlocks(start, end)
    get()._setAvailabilityBlocks(blocks || [])
  },

  addAvailabilityBlock: async (data) => {
    await api.createAvailabilityBlock(data)
  },

  updateAvailabilityBlock: async (id, data) => {
    await api.updateAvailabilityBlock(id, data)
  },

  deleteAvailabilityBlock: async (id) => {
    await api.deleteAvailabilityBlock(id)
  },
}))

export type { AvailabilitySlice }
export { createAvailabilitySlice }
