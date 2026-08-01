import { create } from 'zustand'

import { createAvailabilitySlice, type AvailabilitySlice } from './slices/availability/availabilitySlice'

export const useAvailabilityStore = create<AvailabilitySlice>()((...a) => ({
  ...createAvailabilitySlice(...a),
}))

export type { AvailabilitySlice }
export { createAvailabilitySlice }
