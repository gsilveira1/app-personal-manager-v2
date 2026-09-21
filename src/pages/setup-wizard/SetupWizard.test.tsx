import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SetupWizard } from './SetupWizard'
import { useTenantStore } from '../../states/stores/tenant/tenantStore'
import { useAuthStore } from '../../states/stores/auth/authStore'

vi.mock('../../states/stores/tenant/tenantStore')
vi.mock('../../states/stores/auth/authStore')

describe('SetupWizard', () => {
  const mockFetchTenant = vi.fn()
  const mockCheckAuthStatus = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useTenantStore).mockReturnValue({
      tenant: {
        id: 't-1',
        name: 'Vivi Studio',
        slug: 'vivi',
        setupCompleted: false,
      } as any,
      fetchTenant: mockFetchTenant,
      updateBranding: vi.fn(),
      uploadLogo: vi.fn(),
      setPrimaryColorPreview: vi.fn(),
      connectWhatsapp: vi.fn(),
      checkWhatsappStatus: vi.fn(),
      completeSetup: vi.fn(),
      isLoading: false,
      error: null,
      qrCode: null,
      whatsappStatus: null,
    })

    vi.mocked(useAuthStore).mockReturnValue({
      user: { id: 'u-1', name: 'Trainer' } as any,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
      checkAuthStatus: mockCheckAuthStatus,
      updateProfile: vi.fn(),
      uploadAvatar: vi.fn(),
    })
  })

  it('renders setup wizard and step 1 by default', () => {
    render(
      <MemoryRouter>
        <SetupWizard />
      </MemoryRouter>
    )

    expect(screen.getByTestId('setup-wizard-page')).toBeInTheDocument()
    expect(screen.getByTestId('branding-step')).toBeInTheDocument()
    expect(mockFetchTenant).toHaveBeenCalled()
  })
})
