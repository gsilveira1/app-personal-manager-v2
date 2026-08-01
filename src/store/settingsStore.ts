import { create } from 'zustand'

import * as api from '../services/api/apiService'
import { createSettingsSlice, type SettingsSlice } from './slices/settings/settingsSlice'

export interface SettingsActions {
  updateAiPromptInstructions: (instructions: string) => Promise<void>
  updateLocale: (language: string) => Promise<void>
}

export type SettingsStoreState = SettingsSlice & SettingsActions

export const useSettingsStore = create<SettingsStoreState>()((...a) => ({
  ...createSettingsSlice(...a),

  updateAiPromptInstructions: async (instructions) => {
    const [, get] = [a[0], a[1]]
    await api.updateAiInstructions(instructions)
    get()._setAiPromptInstructions(instructions)
  },

  updateLocale: async (language) => {
    const [, get] = [a[0], a[1]]
    const result = await api.updateLanguage(language)
    get()._setLocale(result.language)
  },
}))

export type { SettingsSlice }
export { createSettingsSlice }
