import { create } from 'zustand'

import { createSettingsSlice, type SettingsSlice } from './slices/settings/settingsSlice'

export const useSettingsStore = create<SettingsSlice>()((...a) => ({
  ...createSettingsSlice(...a),
}))

export type { SettingsSlice }
export { createSettingsSlice }
