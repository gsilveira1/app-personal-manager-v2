import { create } from 'zustand'
import { type StateCreator } from 'zustand'

import * as api from '../../../services/api/apiService'
import { createSettingsSlice, type SettingsSlice } from '../../slices/settings/settingsSlice'

export interface SettingsActions {
  updateAiPromptInstructions: (instructions: string) => Promise<void>
  updateLocale: (language: string) => Promise<void>
}

export type SettingsStoreState = SettingsSlice & SettingsActions

// Single source of truth for all settings async actions.
// Consumed by both useSettingsStore (standalone) and useStore (global).
// Hydration actions (hydrateLocale, hydrateAiInstructions) live in settingsSlice.
export const createSettingsActions: StateCreator<SettingsStoreState, [], [], SettingsActions> = (set, get) => ({
  updateAiPromptInstructions: async (instructions) => {
    await api.updateAiInstructions(instructions)
    get()._setAiPromptInstructions(instructions)
  },

  updateLocale: async (language) => {
    const result = await api.updateLanguage(language)
    get()._setLocale(result.language)
  },
})

export const useSettingsStore = create<SettingsStoreState>()((...a) => ({
  ...createSettingsSlice(...a),
  ...createSettingsActions(...a),
}))

export type { SettingsSlice }
export { createSettingsSlice }
