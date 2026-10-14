import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

const mockNavigateTo = vi.fn()
const mockFetchInitialData = vi.fn()
const mockClearDataOnLogout = vi.fn()
const mockCheckAuthStatus = vi.fn()

let auth: { isAuthenticated: boolean; isLoading: boolean; user: Record<string, unknown> | null }
let data: { appState: string; errorMessage: string | null }

vi.mock('../../utils/navigation', () => ({ navigateTo: (...args: unknown[]) => mockNavigateTo(...args) }))
vi.mock('../../hooks/useI18nBoot', () => ({ useI18nBoot: () => ({ boot: { status: 'ready' }, retry: vi.fn() }) }))
vi.mock('../../i18n/index', () => ({ i18n: { t: (key: string) => key, language: 'pt', changeLanguage: vi.fn() } }))
vi.mock('react-i18next', () => ({ I18nextProvider: ({ children }: { children: React.ReactNode }) => <>{children}</> }))
vi.mock('../../states/stores/auth/authStore', () => ({ useAuthStore: () => ({ ...auth, checkAuthStatus: mockCheckAuthStatus }) }))
vi.mock('../../states/stores/store', () => ({
  useStore: (selector?: (s: Record<string, unknown>) => unknown) => {
    const state = { ...data, locale: '', fetchInitialData: mockFetchInitialData, clearDataOnLogout: mockClearDataOnLogout }
    return selector ? selector(state) : state
  },
}))
vi.mock('./DashboardLayout', () => ({ DashboardLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="dashboard-layout">{children}</div> }))

import { ProtectedPage } from './ProtectedPage'

const trainer = { id: 'u1', role: 'trainer', status: 'ACTIVE', setupCompleted: true }
const View = () => <div data-testid="view">view</div>

describe('ProtectedPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    auth = { isAuthenticated: true, isLoading: false, user: trainer }
    data = { appState: 'ready', errorMessage: null }
  })

  it('renders the view inside the dashboard layout once the data is ready', () => {
    render(
      <ProtectedPage>
        <View />
      </ProtectedPage>
    )
    expect(screen.getByTestId('dashboard-layout')).toContainElement(screen.getByTestId('view'))
    expect(mockNavigateTo).not.toHaveBeenCalled()
  })

  it('renders the view without the layout when bare', () => {
    render(
      <ProtectedPage bare>
        <View />
      </ProtectedPage>
    )
    expect(screen.queryByTestId('dashboard-layout')).not.toBeInTheDocument()
    expect(screen.getByTestId('view')).toBeInTheDocument()
  })

  it('loads the initial data exactly once while idle and shows the loader meanwhile', async () => {
    data = { appState: 'idle', errorMessage: null }
    render(
      <ProtectedPage>
        <View />
      </ProtectedPage>
    )
    expect(screen.getByTestId('full-screen-loader')).toBeInTheDocument()
    expect(screen.queryByTestId('view')).not.toBeInTheDocument()
    await waitFor(() => expect(mockFetchInitialData).toHaveBeenCalledTimes(1))
  })

  it('redirects an anonymous visitor to the login page without rendering the view', async () => {
    auth = { isAuthenticated: false, isLoading: false, user: null }
    render(
      <ProtectedPage>
        <View />
      </ProtectedPage>
    )
    expect(screen.queryByTestId('view')).not.toBeInTheDocument()
    await waitFor(() => expect(mockNavigateTo).toHaveBeenCalledWith('/login', { replace: true }))
    expect(mockFetchInitialData).not.toHaveBeenCalled()
  })

  it('clears the loaded data when the session is gone', async () => {
    auth = { isAuthenticated: false, isLoading: false, user: null }
    render(
      <ProtectedPage>
        <View />
      </ProtectedPage>
    )
    await waitFor(() => expect(mockClearDataOnLogout).toHaveBeenCalledTimes(1))
  })

  it.each([
    ['blocked', { ...trainer, status: 'BLOCKED' }, '/blocked'],
    ['overdue', { ...trainer, status: 'OVERDUE' }, '/blocked'],
    ['not set up', { ...trainer, setupCompleted: false }, '/setup-wizard'],
  ])('sends a %s account to %s', async (_label, user, target) => {
    auth = { isAuthenticated: true, isLoading: false, user }
    render(
      <ProtectedPage>
        <View />
      </ProtectedPage>
    )
    await waitFor(() => expect(mockNavigateTo).toHaveBeenCalledWith(target, { replace: true }))
    expect(screen.queryByTestId('view')).not.toBeInTheDocument()
  })

  it('sends a trainer away from an admin-only page', async () => {
    render(
      <ProtectedPage requireAdmin>
        <View />
      </ProtectedPage>
    )
    await waitFor(() => expect(mockNavigateTo).toHaveBeenCalledWith('/', { replace: true }))
    expect(screen.queryByTestId('view')).not.toBeInTheDocument()
  })

  it('lets the admin into an admin-only page', () => {
    auth = { isAuthenticated: true, isLoading: false, user: { ...trainer, role: 'admin' } }
    render(
      <ProtectedPage requireAdmin>
        <View />
      </ProtectedPage>
    )
    expect(screen.getByTestId('view')).toBeInTheDocument()
    expect(mockNavigateTo).not.toHaveBeenCalled()
  })

  it('shows the error screen with the technical message and retries the load', async () => {
    data = { appState: 'error', errorMessage: 'HTTP 503' }
    render(
      <ProtectedPage>
        <View />
      </ProtectedPage>
    )
    expect(screen.getByText('HTTP 503')).toBeInTheDocument()
    screen.getByRole('button', { name: 'appError.retry' }).click()
    expect(mockFetchInitialData).toHaveBeenCalledTimes(1)
  })

  it('waits for the session check before deciding anything', () => {
    auth = { isAuthenticated: false, isLoading: true, user: null }
    render(
      <ProtectedPage>
        <View />
      </ProtectedPage>
    )
    expect(screen.getByTestId('full-screen-loader')).toHaveTextContent('checkingSession')
    expect(mockNavigateTo).not.toHaveBeenCalled()
  })
})
