import '@testing-library/jest-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ResetPassword } from './ResetPassword'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

const mockResetPassword = vi.fn()
vi.mock('../../services/api/apiService', () => ({
  resetPassword: (...args: unknown[]) => mockResetPassword(...args),
}))

describe('ResetPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.location.hash = '#/reset-password?token=valid-test-token-123'
    window.location.search = ''
  })

  const renderPage = () =>
    render(
      <MemoryRouter>
        <ResetPassword />
      </MemoryRouter>
    )

  it('renders invalid token message when no token is present in URL', () => {
    window.location.hash = '#/reset-password'
    window.location.search = ''

    renderPage()

    expect(screen.getByText('invalidTokenTitle')).toBeInTheDocument()
    expect(screen.getByText('invalidTokenSubtitle')).toBeInTheDocument()
    expect(screen.getByText('requestNewLink')).toBeInTheDocument()
  })

  it('renders password and confirm password fields when token is present', () => {
    renderPage()

    expect(screen.getByText('resetPasswordTitle')).toBeInTheDocument()
    expect(screen.getByLabelText('newPassword')).toBeInTheDocument()
    expect(screen.getByLabelText('confirmPassword')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'resetPasswordSubmit' })).toBeInTheDocument()
  })

  it('shows error when password is shorter than 8 characters', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('newPassword'), 'short')
    await user.type(screen.getByLabelText('confirmPassword'), 'short')
    await user.click(screen.getByRole('button', { name: 'resetPasswordSubmit' }))

    expect(screen.getByText('passwordTooShort')).toBeInTheDocument()
    expect(mockResetPassword).not.toHaveBeenCalled()
  })

  it('shows error when passwords do not match', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('newPassword'), 'Password123!')
    await user.type(screen.getByLabelText('confirmPassword'), 'DifferentPassword123!')
    await user.click(screen.getByRole('button', { name: 'resetPasswordSubmit' }))

    expect(screen.getByText('passwordsDoNotMatch')).toBeInTheDocument()
    expect(mockResetPassword).not.toHaveBeenCalled()
  })

  it('calls resetPassword API and shows success state on valid submission', async () => {
    mockResetPassword.mockResolvedValue({ message: 'Success' })
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('newPassword'), 'ValidNewPassword2026!')
    await user.type(screen.getByLabelText('confirmPassword'), 'ValidNewPassword2026!')
    await user.click(screen.getByRole('button', { name: 'resetPasswordSubmit' }))

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith('valid-test-token-123', 'ValidNewPassword2026!')
      expect(screen.getByText('passwordResetSuccessTitle')).toBeInTheDocument()
      expect(screen.getByText('goToLogin')).toBeInTheDocument()
    })
  })

  it('shows error message if API fails with error', async () => {
    mockResetPassword.mockRejectedValue({ response: { data: { message: 'Token expirado' } } })
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('newPassword'), 'ValidNewPassword2026!')
    await user.type(screen.getByLabelText('confirmPassword'), 'ValidNewPassword2026!')
    await user.click(screen.getByRole('button', { name: 'resetPasswordSubmit' }))

    await waitFor(() => {
      expect(screen.getByText('Token expirado')).toBeInTheDocument()
    })
  })
})
