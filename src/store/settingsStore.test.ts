// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest'

import { useSettingsStore } from './settingsStore'

describe('settingsStore', () => {
  beforeEach(() => {
    useSettingsStore.setState({ aiPromptInstructions: '', locale: '' })
  })

  it('should initialize with empty state', () => {
    expect(useSettingsStore.getState().aiPromptInstructions).toBe('')
    expect(useSettingsStore.getState().locale).toBe('')
  })

  it('should update settings state correctly', () => {
    useSettingsStore.getState()._setAiPromptInstructions('Test prompt')
    expect(useSettingsStore.getState().aiPromptInstructions).toBe('Test prompt')
  })
})
