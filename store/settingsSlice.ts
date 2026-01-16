import { StateCreator } from 'zustand';
import { AppState } from '../store';

export interface SettingsSlice {
  aiPromptInstructions: string;
  _setAiPromptInstructions: (instructions: string) => void;
}

export const createSettingsSlice: StateCreator<
  AppState,
  [],
  [],
  SettingsSlice
> = (set) => ({
  aiPromptInstructions: '',
  _setAiPromptInstructions: (instructions) => set({ aiPromptInstructions: instructions }),
});
