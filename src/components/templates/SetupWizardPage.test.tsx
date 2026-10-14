import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

const mockNavigateTo = vi.fn()
let isAuthenticated: boolean

vi.mock('../../utils/navigation', () => ({ navigateTo: (...args: unknown[]) => mockNavigateTo(...args) }))
vi.mock('../../i18n/index', () => ({ i18n: { t: (key: string) => key } }))
vi.mock('../../states/stores/auth/authStore', () => ({ useAuthStore: () => ({ isAuthenticated }) }))
vi.mock('./AppShell', () => ({ AppShell: ({ children }: { children: React.ReactNode }) => <>{children}</> }))

import { SetupWizardPage } from './SetupWizardPage'

describe('SetupWizardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the wizard for a signed-in trainer', () => {
    isAuthenticated = true
    render(
      <SetupWizardPage>
        <p>wizard</p>
      </SetupWizardPage>
    )
    expect(screen.getByText('wizard')).toBeInTheDocument()
    expect(mockNavigateTo).not.toHaveBeenCalled()
  })

  it('sends an anonymous visitor to the login page', async () => {
    isAuthenticated = false
    render(
      <SetupWizardPage>
        <p>wizard</p>
      </SetupWizardPage>
    )
    expect(screen.queryByText('wizard')).not.toBeInTheDocument()
    await waitFor(() => expect(mockNavigateTo).toHaveBeenCalledWith('/login', { replace: true }))
  })
})
