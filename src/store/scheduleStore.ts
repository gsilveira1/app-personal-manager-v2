import { create } from 'zustand'

import { createScheduleSlice, type ScheduleSlice } from './slices/schedule/scheduleSlice'

export const useScheduleStore = create<ScheduleSlice>()((...a) => ({
  ...createScheduleSlice(...a),
}))

export type { ScheduleSlice }
export { createScheduleSlice }
