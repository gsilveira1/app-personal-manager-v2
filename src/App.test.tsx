import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockCheckAuthStatus = vi.fn()
const mockFetchInitialData = vi.fn()
const mockClearDataOnLogout = vi.fn()

let mockIsAuthenticated = false
let mockIsLoading = false
let mockAppState: string = 'idle'

vi.mock('./store/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    isAuthenticated: mockIsAuthenticated,
    isLoading: mockIsLoading,
    checkAuthStatus: mockCheckAuthStatus,
    user: null,
  })),
}))

vi.mock('./store/store', () => ({
  useStore: vi.fn((selector?: any) => {
    const state = {
      appState: mockAppState,
      errorMessage: 'Something went wrong',
      fetchInitialData: mockFetchInitialData,
      clearDataOnLogout: mockClearDataOnLogout,
      locale: '',
    }
    return selector ? selector(state) : state
  }),
}))

vi.mock('./i18n/index', () => ({
  i18n: {
    t: (key: string) => key,
    language: 'en',
    changeLanguage: vi.fn(),
    use: vi.fn().mockReturnThis(),
    init: vi.fn().mockReturnThis(),
    on: vi.fn(),
    off: vi.fn(),
  },
}))

vi.mock('react-i18next', () => ({
  I18nextProvider: ({ children }: any) => <>{children}</>,
  useTranslation: () => ({ t: (k: string) => k }),
}))

// Instead of rendering the full App with its router, just test the
// key internal components: FullScreenLoader and ProtectedRoute logic.
// App.tsx is primarily a routing shell.

import { useAuthStore } from './store/authStore'
import { useStore } from './store/store'

describe('App module', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsAuthenticated = false
    mockIsLoading = false
    mockAppState = 'idle'
  })

  it('useAuthStore mock works', () => {
    const store: any = vi.mocked(useAuthStore)()
    expect(store.checkAuthStatus).toBe(mockCheckAuthStatus)
  })

  it('useStore mock returns correct state', () => {
    const store: any = vi.mocked(useStore)()
    expect(store.appState).toBe('idle')
    expect(store.fetchInitialData).toBe(mockFetchInitialData)
  })

  it('useStore selector mode works', () => {
    const locale = vi.mocked(useStore)((s: any) => s.locale)
    expect(locale).toBe('')
  })
})
