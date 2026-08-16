import { create } from 'zustand'
import { type StateCreator } from 'zustand'

import * as api from '../../../services/api/apiService'
import { createSettingsSlice, type SettingsSlice } from '../../slices/settings/settingsSlice'

/**
 * Async API actions domain interface for application settings management.
 */
export interface SettingsActions {
  /**
   * Updates custom AI prompt instructions on backend and state.
   *
   * @param instructions - The prompt text string
   * @returns A promise resolving when update completes
   */
  updateAiPromptInstructions: (instructions: string) => Promise<void>
  /**
   * Updates user locale preference on backend and state.
   *
   * @param language - Supported language tag (e.g., 'pt-BR', 'en', 'es')
   * @returns A promise resolving when locale update completes
   */
  updateLocale: (language: string) => Promise<void>
}

/** Composite state type combining SettingsSlice and SettingsActions. */
export type SettingsStoreState = SettingsSlice & SettingsActions

/**
 * Single source of truth for all settings async actions.
 * Consumed by both useSettingsStore (standalone) and useStore (global).
 * Hydration actions (hydrateLocale, hydrateAiInstructions) live in settingsSlice.
 *
 * @param set - Zustand state setter function
 * @param get - Zustand state getter function
 * @returns Object containing settings async action implementations
 */
export const createSettingsActions: StateCreator<SettingsStoreState, [], [], SettingsActions> = (_set, get) => ({
  updateAiPromptInstructions: async (instructions) => {
    await api.updateAiInstructions(instructions)
    get()._setAiPromptInstructions(instructions)
  },

  updateLocale: async (language) => {
    const result = await api.updateLanguage(language)
    get()._setLocale(result.language)
  },
})

/**
 * Zustand hook for managing user settings state and actions.
 *
 * @example
 * const { locale, updateLocale } = useSettingsStore();
 */
export const useSettingsStore = create<SettingsStoreState>()((...a) => ({
  ...createSettingsSlice(...a),
  ...createSettingsActions(...a),
}))

export type { SettingsSlice }
export { createSettingsSlice }
