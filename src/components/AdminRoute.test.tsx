import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router'

const mockState = { user: null as any }

vi.mock('../store/authStore', () => ({
  useAuthStore: () => ({ user: mockState.user }),
}))

import { AdminRoute } from './AdminRoute'

const renderWithRouter = () =>
  render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<div data-testid="admin-content">Admin</div>} />
        </Route>
        <Route path="/" element={<div data-testid="home">Home</div>} />
      </Routes>
    </MemoryRouter>
  )

describe('AdminRoute', () => {
  it('renders Outlet for admin users', () => {
    mockState.user = { id: '1', role: 'admin', name: 'Admin', email: 'admin@test.com' }
    renderWithRouter()
    expect(screen.getByTestId('admin-content')).toBeInTheDocument()
  })

  it('redirects non-admin users to /', () => {
    mockState.user = { id: '2', role: 'trainer', name: 'Trainer', email: 'trainer@test.com' }
    renderWithRouter()
    expect(screen.getByTestId('home')).toBeInTheDocument()
  })

  it('redirects when user is null', () => {
    mockState.user = null
    renderWithRouter()
    expect(screen.getByTestId('home')).toBeInTheDocument()
  })
})
