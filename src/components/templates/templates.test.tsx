import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// Mock react-router Outlet
vi.mock('react-router', () => ({
  Outlet: () => <div data-testid="outlet">Outlet Content</div>,
}))

// Mock Sidebar and AppHeader organisms
vi.mock('../organisms/layout/Sidebar', () => ({
  Sidebar: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
    <div data-testid="sidebar" data-open={isOpen} onClick={onClose}>
      Sidebar
    </div>
  ),
}))

vi.mock('../organisms/layout/AppHeader', () => ({
  AppHeader: ({ onToggleSidebar }: { onToggleSidebar: () => void }) => (
    <div data-testid="app-header" onClick={onToggleSidebar}>
      AppHeader
    </div>
  ),
}))

// Mock lucide-react Dumbbell icon
vi.mock('lucide-react', () => ({
  Dumbbell: ({ className }: { className?: string }) => (
    <svg data-testid="dumbbell-icon" className={className} />
  ),
}))

import { DashboardLayout } from './DashboardLayout'
import { AuthPageLayout } from './AuthPageLayout'

describe('DashboardLayout', () => {
  it('renders the Sidebar component', () => {
    render(<DashboardLayout />)
    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
  })

  it('renders the AppHeader component', () => {
    render(<DashboardLayout />)
    expect(screen.getByTestId('app-header')).toBeInTheDocument()
  })

  it('renders the Outlet for nested routes', () => {
    render(<DashboardLayout />)
    expect(screen.getByTestId('outlet')).toBeInTheDocument()
    expect(screen.getByText('Outlet Content')).toBeInTheDocument()
  })

  it('sidebar starts closed', () => {
    render(<DashboardLayout />)
    expect(screen.getByTestId('sidebar')).toHaveAttribute('data-open', 'false')
  })

  it('opens sidebar when AppHeader toggle is clicked', () => {
    render(<DashboardLayout />)

    // Click AppHeader which triggers onToggleSidebar => setSidebarOpen(true)
    fireEvent.click(screen.getByTestId('app-header'))

    expect(screen.getByTestId('sidebar')).toHaveAttribute('data-open', 'true')
  })

  it('closes sidebar when Sidebar onClose is called', () => {
    render(<DashboardLayout />)

    // Open sidebar first
    fireEvent.click(screen.getByTestId('app-header'))
    expect(screen.getByTestId('sidebar')).toHaveAttribute('data-open', 'true')

    // Click sidebar which triggers onClose => setSidebarOpen(false)
    fireEvent.click(screen.getByTestId('sidebar'))
    expect(screen.getByTestId('sidebar')).toHaveAttribute('data-open', 'false')
  })

  it('renders backdrop overlay when sidebar is open', () => {
    const { container } = render(<DashboardLayout />)

    // Open sidebar
    fireEvent.click(screen.getByTestId('app-header'))

    // The overlay div has class bg-black/50 and z-40
    const overlay = container.querySelector('.fixed.inset-0.z-40')
    expect(overlay).toBeInTheDocument()
  })

  it('closes sidebar when backdrop overlay is clicked', () => {
    const { container } = render(<DashboardLayout />)

    // Open sidebar
    fireEvent.click(screen.getByTestId('app-header'))
    expect(screen.getByTestId('sidebar')).toHaveAttribute('data-open', 'true')

    // Click overlay
    const overlay = container.querySelector('.fixed.inset-0.z-40')
    expect(overlay).not.toBeNull()
    fireEvent.click(overlay!)

    expect(screen.getByTestId('sidebar')).toHaveAttribute('data-open', 'false')
  })

  it('does not render backdrop when sidebar is closed', () => {
    const { container } = render(<DashboardLayout />)
    const overlay = container.querySelector('.fixed.inset-0.z-40')
    expect(overlay).toBeNull()
  })
})

describe('AuthPageLayout', () => {
  it('renders the brand name "PersonalMgr"', () => {
    render(<AuthPageLayout />)
    expect(screen.getByText('PersonalMgr')).toBeInTheDocument()
  })

  it('renders the Dumbbell icon', () => {
    render(<AuthPageLayout />)
    expect(screen.getByTestId('dumbbell-icon')).toBeInTheDocument()
  })

  it('renders the Outlet for nested auth routes', () => {
    render(<AuthPageLayout />)
    expect(screen.getByTestId('outlet')).toBeInTheDocument()
    expect(screen.getByText('Outlet Content')).toBeInTheDocument()
  })

  it('has correct brand styling', () => {
    render(<AuthPageLayout />)
    const brand = screen.getByText('PersonalMgr')
    expect(brand).toHaveClass('text-2xl', 'font-bold')
  })

  it('wraps outlet in a max-width container', () => {
    render(<AuthPageLayout />)
    const outlet = screen.getByTestId('outlet')
    expect(outlet.parentElement).toHaveClass('max-w-sm')
  })
})
