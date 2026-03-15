import { describe, it, expect, vi, beforeEach } from 'vitest'
import { create } from 'zustand'

// Break the circular dependency: settingsSlice.ts imports `type AppState` from
// `./store`, which at runtime (Vite SSR transform) triggers store initialization
// and a circular import. Mocking `store` to an empty object breaks the cycle.
vi.mock('./store', () => ({}))

// Mock i18n before imports that use it
vi.mock('../i18n/index', () => ({
  SUPPORTED_LOCALES: ['en', 'es', 'pt-BR'] as const,
  i18n: {
    changeLanguage: vi.fn().mockResolvedValue(undefined),
  },
}))

// Mock apiService
vi.mock('../services/apiService', () => ({
  getLanguage: vi.fn(),
  updateLanguage: vi.fn(),
}))

import { SUPPORTED_LOCALES, i18n } from '../i18n/index'
import { getLanguage } from '../services/apiService'
import { createSettingsSlice, type SettingsSlice } from './settingsSlice'

const mockGetLanguage = getLanguage as ReturnType<typeof vi.fn>
const mockChangeLanguage = i18n.changeLanguage as ReturnType<typeof vi.fn>

// Build a minimal store for testing the slice in isolation
function makeStore() {
  return create<SettingsSlice & { locale: SettingsSlice['locale'] }>()((set, get, api) => ({
    // Provide minimal AppState stubs required by StateCreator<AppState>
    ...({} as any),
    ...createSettingsSlice(set, get as any, api as any),
  }))
}

describe('settingsSlice', () => {
  let store: ReturnType<typeof makeStore>

  beforeEach(() => {
    vi.clearAllMocks()
    store = makeStore()
  })

  // ─── _setLocale ────────────────────────────────────────────────────────────

  describe('_setLocale', () => {
    it.each(['en', 'es', 'pt-BR'] as const)('accepts valid locale "%s"', (locale) => {
      store.getState()._setLocale(locale)
      expect(store.getState().locale).toBe(locale)
    })

    it('rejects invalid locale "fr" — state unchanged', () => {
      store.getState()._setLocale('es') // set a known value first
      store.getState()._setLocale('fr')
      expect(store.getState().locale).toBe('es')
    })

    it('rejects partial locale "pt" — state unchanged', () => {
      store.getState()._setLocale('en')
      store.getState()._setLocale('pt')
      expect(store.getState().locale).toBe('en')
    })

    it('rejects empty string — state unchanged', () => {
      store.getState()._setLocale('en')
      store.getState()._setLocale('')
      expect(store.getState().locale).toBe('en')
    })
  })

  // ─── hydrateLocale ─────────────────────────────────────────────────────────

  describe('hydrateLocale', () => {
    it('sets locale and calls i18n.changeLanguage when API returns "es"', async () => {
      mockGetLanguage.mockResolvedValue({ language: 'es' })
      await store.getState().hydrateLocale()
      expect(store.getState().locale).toBe('es')
      expect(mockChangeLanguage).toHaveBeenCalledWith('es')
    })

    it('sets locale to "en" when API returns valid "en"', async () => {
      mockGetLanguage.mockResolvedValue({ language: 'en' })
      await store.getState().hydrateLocale()
      expect(store.getState().locale).toBe('en')
      expect(mockChangeLanguage).toHaveBeenCalledWith('en')
    })

    it('falls back to "pt-BR" when API returns unsupported locale "fr"', async () => {
      mockGetLanguage.mockResolvedValue({ language: 'fr' })
      await store.getState().hydrateLocale()
      expect(store.getState().locale).toBe('pt-BR')
      expect(mockChangeLanguage).toHaveBeenCalledWith('pt-BR')
    })

    it('falls back to "pt-BR" on ApiError (auth error)', async () => {
      mockGetLanguage.mockRejectedValue(Object.assign(new Error('Unauthorized'), { status: 401 }))
      await store.getState().hydrateLocale()
      expect(store.getState().locale).toBe('pt-BR')
      expect(mockChangeLanguage).toHaveBeenCalledWith('pt-BR')
    })

    it('falls back to "pt-BR" on TypeError (network error)', async () => {
      mockGetLanguage.mockRejectedValue(new TypeError('Network request failed'))
      await store.getState().hydrateLocale()
      expect(store.getState().locale).toBe('pt-BR')
      expect(mockChangeLanguage).toHaveBeenCalledWith('pt-BR')
    })

    it('does not rethrow on error', async () => {
      mockGetLanguage.mockRejectedValue(new Error('Unexpected'))
      await expect(store.getState().hydrateLocale()).resolves.toBeUndefined()
    })

    it('is idempotent — second call overwrites first', async () => {
      mockGetLanguage.mockResolvedValueOnce({ language: 'es' }).mockResolvedValueOnce({ language: 'pt-BR' })
      await store.getState().hydrateLocale()
      expect(store.getState().locale).toBe('es')
      await store.getState().hydrateLocale()
      expect(store.getState().locale).toBe('pt-BR')
    })
  })

  // Export SUPPORTED_LOCALES sanity check
  it('SUPPORTED_LOCALES has exactly 3 entries', () => {
    expect(SUPPORTED_LOCALES).toHaveLength(3)
    expect(SUPPORTED_LOCALES).toContain('en')
    expect(SUPPORTED_LOCALES).toContain('es')
    expect(SUPPORTED_LOCALES).toContain('pt-BR')
  })
})
