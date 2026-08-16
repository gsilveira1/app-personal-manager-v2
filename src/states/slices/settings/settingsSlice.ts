import { type StateCreator } from 'zustand'

import { SUPPORTED_LOCALES, type SupportedLocale } from '../../../i18n/constants'
import { getAiInstructions, getLanguage } from '../../../services/api/apiService'

/**
 * Slice managing application user settings and locale preferences.
 */
export interface SettingsSlice {
  /** Custom instructions string provided to AI generators. */
  aiPromptInstructions: string
  /**
   * Internal mutator for setting AI instructions.
   *
   * @param instructions - The custom instruction prompt string
   */
  _setAiPromptInstructions: (instructions: string) => void
  /** Currently selected user locale string. */
  locale: SupportedLocale | ''
  /**
   * Internal mutator for updating locale.
   *
   * @param locale - Supported locale identifier string
   */
  _setLocale: (locale: string) => void
  /**
   * Hydrates user locale preference from backend or fallback.
   *
   * @returns A promise resolving when locale is loaded and set
   * @example
   * await hydrateLocale();
   */
  hydrateLocale: () => Promise<void>
  /**
   * Hydrates custom AI instructions from backend.
   *
   * @returns A promise resolving when AI instructions are loaded
   * @example
   * await hydrateAiInstructions();
   */
  hydrateAiInstructions: () => Promise<void>
}

/**
 * Creates the settings slice state creator for Zustand store integration.
 *
 * @param set - Zustand state setter function
 * @param get - Zustand state getter function
 * @returns Initialized SettingsSlice state object and methods
 * @example
 * const slice = createSettingsSlice(set, get, storeApi);
 */
export const createSettingsSlice: StateCreator<SettingsSlice, [], [], SettingsSlice> = (set, get) => ({
  aiPromptInstructions: '',
  _setAiPromptInstructions: (instructions) => set({ aiPromptInstructions: instructions }),

  locale: '',

  _setLocale: (locale: string) => {
    if ((SUPPORTED_LOCALES as readonly string[]).includes(locale)) {
      set({ locale: locale as SupportedLocale })
    }
  },

  hydrateLocale: async () => {
    try {
      const { language } = await getLanguage()
      const resolved: SupportedLocale = (SUPPORTED_LOCALES as readonly string[]).includes(language) ? (language as SupportedLocale) : 'pt-BR'
      get()._setLocale(resolved)
      const { i18n } = await import('../../../i18n/index')
      await i18n.changeLanguage(resolved)
    } catch {
      get()._setLocale('pt-BR')
      const { i18n } = await import('../../../i18n/index')
      await i18n.changeLanguage('pt-BR')
    }
  },

  hydrateAiInstructions: async () => {
    try {
      const { instructions } = await getAiInstructions()
      get()._setAiPromptInstructions(instructions)
    } catch (error) {
      console.error('Failed to hydrate AI instructions:', error)
    }
  },
})
