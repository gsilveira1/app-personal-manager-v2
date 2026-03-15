import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { SignUp } from './SignUp'

const mockNavigate = vi.fn()
vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

const mockSignup = vi.fn()
vi.mock('../store/authStore', () => ({
  useAuthStore: () => ({ signup: mockSignup }),
}))

describe('SignUp', () => {
  beforeEach(() => { vi.clearAllMocks() })

  const renderSignUp = () => render(<MemoryRouter><SignUp /></MemoryRouter>)

  it('renders name, email, and password fields', () => {
    renderSignUp()
    expect(screen.getByLabelText('fullName')).toBeInTheDocument()
    expect(screen.getByLabelText('email')).toBeInTheDocument()
    expect(screen.getByLabelText('password')).toBeInTheDocument()
  })

  it('calls signup and navigates to /login on success', async () => {
    mockSignup.mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderSignUp()

    await user.type(screen.getByLabelText('fullName'), 'Test User')
    await user.type(screen.getByLabelText('email'), 'test@test.com')
    await user.type(screen.getByLabelText('password'), 'password123')
    await user.click(screen.getByRole('button', { name: 'createAccount' }))

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith('Test User', 'test@test.com', 'password123')
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })
  })

  it('shows error on failed signup', async () => {
    mockSignup.mockRejectedValue(new Error('Email taken'))
    const user = userEvent.setup()
    renderSignUp()

    await user.type(screen.getByLabelText('fullName'), 'Test')
    await user.type(screen.getByLabelText('email'), 'taken@test.com')
    await user.type(screen.getByLabelText('password'), 'pass')
    await user.click(screen.getByRole('button', { name: 'createAccount' }))

    await waitFor(() => {
      expect(screen.getByText('Email taken')).toBeInTheDocument()
    })
  })

  it('renders sign in link', () => {
    renderSignUp()
    expect(screen.getByText('signIn')).toBeInTheDocument()
  })
})
