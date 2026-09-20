import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrandingStep } from './BrandingStep'
import { useTenantStore } from '../../../states/stores/tenant/tenantStore'

vi.mock('../../../states/stores/tenant/tenantStore')

describe('BrandingStep', () => {
  const mockUpdateBranding = vi.fn()
  const uploadLogo = vi.fn()
  const setPrimaryColorPreview = vi.fn()
  const onComplete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useTenantStore).mockReturnValue({
      tenant: {
        id: 't-1',
        name: 'Vivi Studio',
        slug: 'vivi',
        primaryColor: '#10B981',
        setupCompleted: false,
      } as any,
      updateBranding: mockUpdateBranding,
      uploadLogo,
      setPrimaryColorPreview,
      isLoading: false,
      error: null,
      qrCode: null,
      whatsappStatus: null,
      fetchTenant: vi.fn(),
      connectWhatsapp: vi.fn(),
      checkWhatsappStatus: vi.fn(),
      completeSetup: vi.fn(),
    })
  })

  it('renders branding step elements correctly', () => {
    render(<BrandingStep onComplete={onComplete} />)
    expect(screen.getByTestId('branding-step')).toBeInTheDocument()
    expect(screen.getByTestId('save-step-1-button')).toBeInTheDocument()
  })

  it('updates color when preset color is clicked', () => {
    render(<BrandingStep onComplete={onComplete} />)
    const bluePreset = screen.getByTestId('color-preset-blue')
    fireEvent.click(bluePreset)

    expect(setPrimaryColorPreview).toHaveBeenCalledWith('#2563EB')
  })

  it('calls updateBranding and onComplete when saving', async () => {
    mockUpdateBranding.mockResolvedValue({})
    render(<BrandingStep onComplete={onComplete} />)

    const saveButton = screen.getByTestId('save-step-1-button')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockUpdateBranding).toHaveBeenCalled()
      expect(onComplete).toHaveBeenCalled()
    })
  })
})
