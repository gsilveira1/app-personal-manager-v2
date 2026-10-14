import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// --- Mocks ---

const mockLogout = vi.fn().mockResolvedValue(undefined)
const mockClearDataOnLogout = vi.fn()
const mockUser = { id: '1', name: 'John Doe', email: 'john@example.com', role: 'trainer' }
let mockClients: Array<{ id: string; name: string; status: string }> = []

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

const mockNavigateTo = vi.fn()

vi.mock('../../../utils/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../utils/navigation')>()),
  navigateTo: (...args: unknown[]) => mockNavigateTo(...args),
}))

vi.mock('../../LanguageSwitcher', () => ({
  LanguageSwitcher: () => <div data-testid="lang-switcher" />,
}))

vi.mock('../../../states/stores/auth/authStore', () => ({
  useAuthStore: () => ({
    user: mockUser,
    logout: mockLogout,
  }),
}))

vi.mock('../../../states/stores/store', () => ({
  useStore: (selector?: (s: any) => any) => {
    const state = {
      clients: mockClients,
      clearDataOnLogout: mockClearDataOnLogout,
    }
    return selector ? selector(state) : state
  },
}))

import { AppHeader } from './AppHeader'
import { Sidebar } from './Sidebar'
import { UserMenu } from './UserMenu'

// --- Tests ---

describe('AppHeader', () => {
  it('renders the menu button that calls onToggleSidebar when clicked', () => {
    const onToggle = vi.fn()
    render(<AppHeader onToggleSidebar={onToggle} />)

    const buttons = screen.getAllByRole('button')
    // The menu button is the first one (md:hidden class)
    const menuButton = buttons[0]
    fireEvent.click(menuButton)
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('renders LanguageSwitcher', () => {
    render(<AppHeader onToggleSidebar={vi.fn()} />)
    expect(screen.getByTestId('lang-switcher')).toBeInTheDocument()
  })

  it('renders UserMenu with avatar button', () => {
    render(<AppHeader onToggleSidebar={vi.fn()} />)
    // UserMenu renders avatar image with alt="profile" (from t('profile'))
    expect(screen.getByAltText('profile')).toBeInTheDocument()
  })
})

describe('Sidebar', () => {
  beforeEach(() => {
    mockClients = []
    window.history.replaceState(null, '', '/')
  })

  const currentLinks = () => screen.getAllByRole('link').filter((link) => link.getAttribute('aria-current') === 'page')

  it('marks only the link of the current page with aria-current="page" and the active classes', () => {
    window.history.replaceState(null, '', '/clients')
    render(<Sidebar isOpen={true} onClose={vi.fn()} />)

    const clientsLink = screen.getByTestId('nav-clients')
    expect(currentLinks()).toEqual([clientsLink])
    expect(clientsLink).toHaveClass('bg-indigo-600', 'text-white')
    expect(screen.getByTestId('nav-dashboard')).not.toHaveAttribute('aria-current')
    expect(screen.getByTestId('nav-dashboard')).toHaveClass('text-slate-300')
    expect(screen.getByTestId('nav-dashboard')).not.toHaveClass('bg-indigo-600')
  })

  it('marks the dashboard link as current when the page is /dashboards, and no other link', () => {
    window.history.replaceState(null, '', '/dashboards')
    render(<Sidebar isOpen={true} onClose={vi.fn()} />)

    const dashboardLink = screen.getByTestId('nav-dashboard')
    expect(currentLinks()).toEqual([dashboardLink])
    expect(dashboardLink).toHaveClass('bg-indigo-600', 'text-white')
    expect(screen.getByTestId('nav-clients')).not.toHaveAttribute('aria-current')
    expect(screen.getByTestId('nav-clients')).not.toHaveClass('bg-indigo-600')
  })

  it('renders the logo text "PersonalMgr"', () => {
    render(<Sidebar isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByText('PersonalMgr')).toBeInTheDocument()
  })

  it('renders all navigation items', () => {
    render(<Sidebar isOpen={true} onClose={vi.fn()} />)
    // Translation keys are returned as-is
    expect(screen.getByText('dashboard')).toBeInTheDocument()
    expect(screen.getByText('clients')).toBeInTheDocument()
    expect(screen.getByText('schedule')).toBeInTheDocument()
    expect(screen.getByText('workouts')).toBeInTheDocument()
    expect(screen.getByText('leads')).toBeInTheDocument()
    expect(screen.getByText('notifications')).toBeInTheDocument()
    expect(screen.getByText('settings')).toBeInTheDocument()
  })

  it('links to the AI page between notifications and settings', () => {
    render(<Sidebar isOpen={true} onClose={vi.fn()} />)
    const hrefs = screen.getAllByRole('link').map((link) => link.getAttribute('href'))
    expect(screen.getByText('ai').closest('a')).toHaveAttribute('href', '/ai')
    expect(hrefs.indexOf('/ai')).toBe(hrefs.indexOf('/notifications') + 1)
    expect(hrefs.indexOf('/settings')).toBe(hrefs.indexOf('/ai') + 1)
  })

  it('never links to the admin area, not even for an admin: that entry lives in the user menu', () => {
    mockUser.role = 'admin'
    try {
      render(<Sidebar isOpen={true} onClose={vi.fn()} />)
      const hrefs = screen.getAllByRole('link').map((link) => link.getAttribute('href'))
      expect(hrefs.filter((href) => href?.startsWith('/admin'))).toEqual([])
    } finally {
      mockUser.role = 'trainer'
    }
  })

  it('shows lead badge with count when there are leads', () => {
    mockClients = [
      { id: '1', name: 'Lead 1', status: 'Lead' },
      { id: '2', name: 'Lead 2', status: 'Lead' },
      { id: '3', name: 'Active Client', status: 'Active' },
    ]
    render(<Sidebar isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('shows "9+" when lead count exceeds 9', () => {
    mockClients = Array.from({ length: 12 }, (_, i) => ({
      id: String(i),
      name: `Lead ${i}`,
      status: 'Lead',
    }))
    render(<Sidebar isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByText('9+')).toBeInTheDocument()
  })

  it('does not show lead badge when there are no leads', () => {
    mockClients = [{ id: '1', name: 'Active', status: 'Active' }]
    render(<Sidebar isOpen={true} onClose={vi.fn()} />)
    // No badge element should be present (no number rendered)
    expect(screen.queryByText('9+')).not.toBeInTheDocument()
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(<Sidebar isOpen={true} onClose={onClose} />)

    // The close button is the second button (after nav links, it is the X button)
    const buttons = screen.getAllByRole('button')
    // The X close button is inside the header area
    const closeButton = buttons[0] // only button in sidebar
    fireEvent.click(closeButton)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

describe('UserMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the avatar button', () => {
    render(<UserMenu />)
    expect(screen.getByAltText('profile')).toBeInTheDocument()
  })

  it('shows user name on wider screens', () => {
    render(<UserMenu />)
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })

  it('opens dropdown with user name and email on click', async () => {
    const user = userEvent.setup()
    render(<UserMenu />)

    // Before click, dropdown content should not be visible
    // The user name appears twice (once in button, once in dropdown) after click
    const avatarButton = screen.getByRole('button')
    await user.click(avatarButton)

    // Dropdown now visible with email
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
    // Logout button should be visible
    expect(screen.getByText('logout')).toBeInTheDocument()
  })

  it('does not offer the admin area to a trainer', async () => {
    const user = userEvent.setup()
    render(<UserMenu />)

    await user.click(screen.getByTestId('user-menu-toggle'))

    expect(screen.getByTestId('user-menu-profile')).toBeInTheDocument()
    expect(screen.queryByTestId('user-menu-admin')).not.toBeInTheDocument()
  })

  it('takes an admin to the admin area and closes the menu', async () => {
    mockUser.role = 'admin'
    try {
      const user = userEvent.setup()
      render(<UserMenu />)

      await user.click(screen.getByTestId('user-menu-toggle'))
      await user.click(screen.getByTestId('user-menu-admin'))

      expect(mockNavigateTo).toHaveBeenCalledWith('/admin/users')
      expect(screen.queryByTestId('user-menu-admin')).not.toBeInTheDocument()
    } finally {
      mockUser.role = 'trainer'
    }
  })

  it('calls logout, clearDataOnLogout, and navigates to /login on logout click', async () => {
    const user = userEvent.setup()
    render(<UserMenu />)

    // Open dropdown
    await user.click(screen.getByRole('button'))

    // Click logout
    const logoutButton = screen.getByText('logout')
    await user.click(logoutButton)

    expect(mockLogout).toHaveBeenCalledTimes(1)
    expect(mockClearDataOnLogout).toHaveBeenCalledTimes(1)
    expect(mockNavigateTo).toHaveBeenCalledWith('/login')
  })
})
