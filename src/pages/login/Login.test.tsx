import '@testing-library/jest-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { Login } from './Login'

const mockNavigate = vi.fn()
vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

const mockLogin = vi.fn()
vi.mock('../../states/stores/auth/authStore', () => ({
  useAuthStore: () => ({
    login: mockLogin,
  }),
}))

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const renderLogin = () =>
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )

  it('renders email and password fields', () => {
    renderLogin()
    expect(screen.getByLabelText('email')).toBeInTheDocument()
    expect(screen.getByLabelText('password')).toBeInTheDocument()
  })

  it('renders sign in button', () => {
    renderLogin()
    expect(screen.getByRole('button', { name: 'signIn' })).toBeInTheDocument()
  })

  it('calls login and navigates on successful submit', async () => {
    mockLogin.mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText('email'), 'trainer@test.com')
    await user.type(screen.getByLabelText('password'), 'password123')
    await user.click(screen.getByRole('button', { name: 'signIn' }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('trainer@test.com', 'password123')
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })
  })

  it('shows error message on failed login', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid credentials'))
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText('email'), 'bad@test.com')
    await user.type(screen.getByLabelText('password'), 'wrong')
    await user.click(screen.getByRole('button', { name: 'signIn' }))

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
  })

  it('shows fallback error when login throws without message', async () => {
    mockLogin.mockRejectedValue(new Error())
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText('email'), 'bad@test.com')
    await user.type(screen.getByLabelText('password'), 'wrong')
    await user.click(screen.getByRole('button', { name: 'signIn' }))

    await waitFor(() => {
      expect(screen.getByText('failedLogin')).toBeInTheDocument()
    })
  })

  it('renders forgot password and sign up links', () => {
    renderLogin()
    expect(screen.getByText('forgotPassword')).toBeInTheDocument()
    expect(screen.getByText('signUp')).toBeInTheDocument()
  })

  it('renders role selector tabs for Trainer, Admin, and Student', () => {
    renderLogin()
    expect(screen.getByText('roleTrainer')).toBeInTheDocument()
    expect(screen.getByText('roleAdmin')).toBeInTheDocument()
    expect(screen.getByText('roleStudent')).toBeInTheDocument()
    expect(screen.getByText('roleTrainerDesc')).toBeInTheDocument()
  })

  it('switches to admin role description when Admin tab is clicked', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.click(screen.getByText('roleAdmin'))
    expect(screen.getByText('roleAdminDesc')).toBeInTheDocument()
  })

  it('switches to student portal mode and allows navigating to workout slug', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.click(screen.getByText('roleStudent'))
    expect(screen.getByText('studentPortalPrompt')).toBeInTheDocument()
    expect(screen.getByLabelText('workoutCodeOrSlug')).toBeInTheDocument()

    await user.type(screen.getByLabelText('workoutCodeOrSlug'), 'aluno-maria')
    await user.click(screen.getByRole('button', { name: 'accessWorkout' }))

    expect(mockNavigate).toHaveBeenCalledWith('/p/aluno-maria')
  })

  it('toggles password visibility when eye button is clicked', async () => {
    const user = userEvent.setup()
    renderLogin()

    const passwordInput = screen.getByLabelText('password')
    expect(passwordInput).toHaveAttribute('type', 'password')

    const toggleBtn = screen.getByRole('button', { name: 'showPassword' })
    await user.click(toggleBtn)

    expect(passwordInput).toHaveAttribute('type', 'text')

    const hideBtn = screen.getByRole('button', { name: 'hidePassword' })
    await user.click(hideBtn)

    expect(passwordInput).toHaveAttribute('type', 'password')
  })
})

