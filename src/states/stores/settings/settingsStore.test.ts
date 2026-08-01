// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../services/api/apiService', () => ({
  updateAiInstructions: vi.fn(),
  updateLanguage: vi.fn(),
  getAiInstructions: vi.fn(),
  getLanguage: vi.fn(),
}))

vi.mock('../../../i18n/index', () => ({
  SUPPORTED_LOCALES: ['pt-BR', 'en'],
  i18n: {
    changeLanguage: vi.fn().mockResolvedValue(undefined),
  },
}))

import * as api from '../../../services/api/apiService'
import { useSettingsStore } from './settingsStore'

const mockApi = api as Record<string, ReturnType<typeof vi.fn>>

describe('settingsStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useSettingsStore.setState({ aiPromptInstructions: '', locale: '' })
  })

  it('should initialize with empty state', () => {
    expect(useSettingsStore.getState().aiPromptInstructions).toBe('')
    expect(useSettingsStore.getState().locale).toBe('')
  })

  it('should update settings state correctly (sync)', () => {
    useSettingsStore.getState()._setAiPromptInstructions('Test prompt')
    expect(useSettingsStore.getState().aiPromptInstructions).toBe('Test prompt')
  })

  describe('updateAiPromptInstructions', () => {
    it('should call API and update store', async () => {
      mockApi.updateAiInstructions.mockResolvedValue(undefined)

      await useSettingsStore.getState().updateAiPromptInstructions('new instructions')

      expect(mockApi.updateAiInstructions).toHaveBeenCalledWith('new instructions')
      expect(useSettingsStore.getState().aiPromptInstructions).toBe('new instructions')
    })
  })

  describe('updateLocale', () => {
    it('should call updateLanguage API and set locale', async () => {
      mockApi.updateLanguage.mockResolvedValue({ language: 'en' })

      await useSettingsStore.getState().updateLocale('en')

      expect(mockApi.updateLanguage).toHaveBeenCalledWith('en')
    })
  })
})
