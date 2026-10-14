import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

const mockNavigateTo = vi.fn()
const mockCheckAuthStatus = vi.fn()
const mockChangeLanguage = vi.fn()
const mockRetry = vi.fn()
let boot: { status: string; message?: string }
let isLoading: boolean
let locale: string

vi.mock('../../utils/navigation', () => ({ navigateTo: (...args: unknown[]) => mockNavigateTo(...args) }))
vi.mock('../../hooks/useI18nBoot', () => ({ useI18nBoot: () => ({ boot, retry: mockRetry }) }))
vi.mock('../../i18n/index', () => ({ i18n: { t: (key: string) => key, language: 'pt', changeLanguage: (l: string) => mockChangeLanguage(l) } }))
vi.mock('react-i18next', () => ({ I18nextProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="i18n-provider">{children}</div> }))
vi.mock('../../states/stores/auth/authStore', () => ({ useAuthStore: () => ({ isLoading, checkAuthStatus: mockCheckAuthStatus }) }))
vi.mock('../../states/stores/store', () => ({ useStore: (selector: (s: { locale: string }) => unknown) => selector({ locale }) }))

import { AppShell } from './AppShell'

describe('AppShell', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    boot = { status: 'ready' }
    isLoading = false
    locale = ''
    window.history.replaceState(null, '', '/login')
  })

  it('checks the session and renders the children inside the i18n provider', async () => {
    render(
      <AppShell>
        <p>child</p>
      </AppShell>
    )
    expect(screen.getByTestId('i18n-provider')).toHaveTextContent('child')
    await waitFor(() => expect(mockCheckAuthStatus).toHaveBeenCalledTimes(1))
  })

  it('shows a blank loader while the translations load', () => {
    boot = { status: 'pending' }
    render(
      <AppShell>
        <p>child</p>
      </AppShell>
    )
    expect(screen.getByTestId('full-screen-loader')).toBeInTheDocument()
    expect(screen.queryByText('child')).not.toBeInTheDocument()
  })

  it('shows the fixed-text error screen when the translations fail and can retry', () => {
    boot = { status: 'failed', message: 'HTTP 500' }
    render(
      <AppShell>
        <p>child</p>
      </AppShell>
    )
    expect(screen.getByText('HTTP 500')).toBeInTheDocument()
    screen.getByRole('button', { name: 'Tentar novamente' }).click()
    expect(mockRetry).toHaveBeenCalledTimes(1)
  })

  it('shows the session loader while the session is being checked', () => {
    isLoading = true
    render(
      <AppShell>
        <p>child</p>
      </AppShell>
    )
    expect(screen.getByTestId('full-screen-loader')).toHaveTextContent('checkingSession')
  })

  it('applies the account locale to i18n', () => {
    locale = 'en'
    render(
      <AppShell>
        <p>child</p>
      </AppShell>
    )
    expect(mockChangeLanguage).toHaveBeenCalledWith('en')
  })

  it('forwards a legacy hash link to its page instead of checking the session', async () => {
    window.history.replaceState(null, '', '/#/p/viviana?token=abc')
    render(
      <AppShell>
        <p>child</p>
      </AppShell>
    )
    await waitFor(() => expect(mockNavigateTo).toHaveBeenCalledWith('/p/viviana?token=abc', { replace: true }))
    expect(mockCheckAuthStatus).not.toHaveBeenCalled()
    expect(screen.queryByText('child')).not.toBeInTheDocument()
  })
})
