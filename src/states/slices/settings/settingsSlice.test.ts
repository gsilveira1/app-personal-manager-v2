// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { create } from 'zustand'

import { createSettingsSlice, type SettingsSlice } from './settingsSlice'

vi.mock('../../../services/api/apiService', () => ({
  getLanguage: vi.fn(),
  getAiInstructions: vi.fn(),
}))

vi.mock('../../../i18n/index', () => ({
  SUPPORTED_LOCALES: ['pt-BR', 'en', 'es'] as const,
  i18n: {
    changeLanguage: vi.fn().mockResolvedValue(undefined),
  },
}))

import { getLanguage, getAiInstructions } from '../../../services/api/apiService'
import { i18n } from '../../../i18n/index'

const mockGetLanguage = vi.mocked(getLanguage)
const mockGetAiInstructions = vi.mocked(getAiInstructions)
const mockChangeLanguage = vi.mocked(i18n.changeLanguage)

const createTestStore = () => create<SettingsSlice>()((...a) => ({ ...createSettingsSlice(...a) }))

describe('settingsSlice', () => {
  let store: ReturnType<typeof createTestStore>

  beforeEach(() => {
    store = createTestStore()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initial state', () => {
    it('should initialize with empty aiPromptInstructions and empty locale', () => {
      expect(store.getState().aiPromptInstructions).toBe('')
      expect(store.getState().locale).toBe('')
    })
  })

  describe('_setAiPromptInstructions', () => {
    it('should set instructions correctly', () => {
      store.getState()._setAiPromptInstructions('Custom prompt')
      expect(store.getState().aiPromptInstructions).toBe('Custom prompt')
    })
  })

  describe('_setLocale', () => {
    it('should update locale when given a supported locale', () => {
      store.getState()._setLocale('en')
      expect(store.getState().locale).toBe('en')
    })

    it('should ignore unsupported locale string', () => {
      store.getState()._setLocale('invalid-lang')
      expect(store.getState().locale).toBe('')
    })
  })

  describe('hydrateLocale', () => {
    it('should hydrate locale from API and update i18n', async () => {
      mockGetLanguage.mockResolvedValue({ language: 'en' })

      await store.getState().hydrateLocale()

      expect(store.getState().locale).toBe('en')
      expect(mockChangeLanguage).toHaveBeenCalledWith('en')
    })

    it('should fallback to pt-BR when API throws', async () => {
      mockGetLanguage.mockRejectedValue(new Error('Network error'))

      await store.getState().hydrateLocale()

      expect(store.getState().locale).toBe('pt-BR')
      expect(mockChangeLanguage).toHaveBeenCalledWith('pt-BR')
    })
  })

  describe('hydrateAiInstructions', () => {
    it('should hydrate AI instructions from API', async () => {
      mockGetAiInstructions.mockResolvedValue({ instructions: 'AI instructions' })

      await store.getState().hydrateAiInstructions()

      expect(store.getState().aiPromptInstructions).toBe('AI instructions')
    })
  })
})
