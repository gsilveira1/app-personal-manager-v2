import '@testing-library/jest-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ForgotPassword } from './ForgotPassword'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, opts?: Record<string, unknown>) => opts?.email ? `${key} ${opts.email}` : key }),
}))

const mockRequestPasswordReset = vi.fn()
vi.mock('../services/apiService', () => ({
  requestPasswordReset: (...args: unknown[]) => mockRequestPasswordReset(...args),
}))

describe('ForgotPassword', () => {
  beforeEach(() => { vi.clearAllMocks() })

  const renderPage = () => render(<MemoryRouter><ForgotPassword /></MemoryRouter>)

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
  })

  it('shows success even on API error (security pattern)', async () => {
    mockRequestPasswordReset.mockRejectedValue(new Error('Not found'))
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('email'), 'unknown@test.com')
    await user.click(screen.getByRole('button', { name: 'sendRecoveryLink' }))

    await waitFor(() => {
      expect(screen.getByText('checkYourEmail')).toBeInTheDocument()
    })
  })

  it('renders sign in link', () => {
    renderPage()
    expect(screen.getByText('signIn')).toBeInTheDocument()
  })
})
