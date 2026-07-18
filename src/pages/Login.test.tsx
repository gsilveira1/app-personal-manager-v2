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
vi.mock('../store/authStore', () => ({
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
})
