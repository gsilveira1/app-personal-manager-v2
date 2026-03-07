import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the store before importing the detector
vi.mock('../store/store', () => ({
  useStore: {
    getState: vi.fn(),
  },
}))

// Mock the apiService before importing the detector
vi.mock('../services/apiService', () => ({
  updateLanguage: vi.fn(),
}))

import { useStore } from '../store/store'
import { updateLanguage } from '../services/apiService'
import { localeDetector } from './localeDetector'

const mockGetState = useStore.getState as ReturnType<typeof vi.fn>
const mockUpdateLanguage = updateLanguage as ReturnType<typeof vi.fn>

describe('localeDetector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ─── lookup ────────────────────────────────────────────────────────────────

  describe('lookup()', () => {
    it('returns stored locale when store has "pt-BR"', () => {
      mockGetState.mockReturnValue({ locale: 'pt-BR' })
      expect(localeDetector.lookup?.()).toBe('pt-BR')
    })

    it('returns undefined when store locale is empty (not hydrated)', () => {
      mockGetState.mockReturnValue({ locale: '' })
      expect(localeDetector.lookup?.()).toBeUndefined()
    })

    it('returns "en" when store has "en"', () => {
      mockGetState.mockReturnValue({ locale: 'en' })
      expect(localeDetector.lookup?.()).toBe('en')
    })
  })

  // ─── cacheUserLanguage ────────────────────────────────────────────────────

  describe('cacheUserLanguage()', () => {
    it('calls updateLanguage with the given locale', () => {
      mockUpdateLanguage.mockResolvedValue({ language: 'es' })
      localeDetector.cacheUserLanguage?.('es')
      expect(mockUpdateLanguage).toHaveBeenCalledWith('es')
    })

    it('is fire-and-forget — returns synchronously (undefined, not a Promise)', () => {
      mockUpdateLanguage.mockResolvedValue({ language: 'es' })
      const result = localeDetector.cacheUserLanguage?.('es')
      expect(result).toBeUndefined()
    })

    it('logs error and does NOT throw when API rejects with a network error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockUpdateLanguage.mockRejectedValue(new TypeError('Network error'))

      // Call without await — fire-and-forget
      localeDetector.cacheUserLanguage?.('es')

      // Wait for microtasks to complete so the .catch() runs
      await vi.waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled()
      })

      consoleSpy.mockRestore()
    })

    it('logs error and does NOT throw when API rejects with a generic error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockUpdateLanguage.mockRejectedValue(new Error('API Error 401'))

      localeDetector.cacheUserLanguage?.('es')

      await vi.waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled()
      })

      consoleSpy.mockRestore()
    })
  })
})
