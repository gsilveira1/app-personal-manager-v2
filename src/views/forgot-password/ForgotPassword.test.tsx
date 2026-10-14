import '@testing-library/jest-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ForgotPassword } from './ForgotPassword'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => (opts?.email ? `${key} ${opts.email}` : key),
  }),
}))

const mockRequestPasswordReset = vi.fn()
vi.mock('../../services/api/apiService', () => ({
  requestPasswordReset: (...args: unknown[]) => mockRequestPasswordReset(...args),
}))

describe('ForgotPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const renderPage = () => render(<ForgotPassword />)

  it('renders email field and submit button', () => {
    renderPage()
    expect(screen.getByLabelText('email')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'sendRecoveryLink' })).toBeInTheDocument()
  })

  it('shows success message after submit', async () => {
    mockRequestPasswordReset.mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('email'), 'test@test.com')
    await user.click(screen.getByRole('button', { name: 'sendRecoveryLink' }))

    await waitFor(() => {
      expect(screen.getByText('checkYourEmail')).toBeInTheDocument()
    })
    // Regression: the API mock used to point at a path that does not exist, so it never
    // applied and the "success" came from the catch branch instead of from the API call.
    expect(mockRequestPasswordReset).toHaveBeenCalledWith('test@test.com')
  })

  it('shows success even on API error (security pattern) but logs the failure', async () => {
    const failure = new Error('Not found')
    mockRequestPasswordReset.mockRejectedValue(failure)
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('email'), 'unknown@test.com')
    await user.click(screen.getByRole('button', { name: 'sendRecoveryLink' }))

    await waitFor(() => {
      expect(screen.getByText('checkYourEmail')).toBeInTheDocument()
    })
    // The visitor must not learn whether the address exists, but the failure is never silent.
    expect(consoleError).toHaveBeenCalledWith('[ForgotPassword] Password reset request failed:', failure)
    consoleError.mockRestore()
  })

  it('renders sign in link', () => {
    renderPage()
    expect(screen.getByRole('link', { name: 'signIn' })).toHaveAttribute('href', '/login')
  })
})
