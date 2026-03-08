import { type StateCreator } from 'zustand'

import { type AppState } from './store'
import { SUPPORTED_LOCALES, type SupportedLocale, i18n } from '../i18n/index'
import { getAiInstructions, getLanguage } from '../services/apiService'

export interface SettingsSlice {
  aiPromptInstructions: string
  _setAiPromptInstructions: (instructions: string) => void
  locale: SupportedLocale | ''
  _setLocale: (locale: string) => void
  hydrateLocale: () => Promise<void>
  hydrateAiInstructions: () => Promise<void>
}

export const createSettingsSlice: StateCreator<AppState, [], [], SettingsSlice> = (set, get) => ({
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
      await i18n.changeLanguage(resolved)
    } catch {
      get()._setLocale('pt-BR')
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
