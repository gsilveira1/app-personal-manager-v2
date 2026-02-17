import { type StateCreator } from 'zustand'

import { type AppState } from './store'

export interface SettingsSlice {
  aiPromptInstructions: string
  _setAiPromptInstructions: (instructions: string) => void
}

export const createSettingsSlice: StateCreator<AppState, [], [], SettingsSlice> = (set) => ({
  aiPromptInstructions: '',
  _setAiPromptInstructions: (instructions) => set({ aiPromptInstructions: instructions }),
})
