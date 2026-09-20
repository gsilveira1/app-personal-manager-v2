import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { WhatsAppStep } from './WhatsAppStep'
import { useTenantStore } from '../../../states/stores/tenant/tenantStore'

vi.mock('../../../states/stores/tenant/tenantStore')

describe('WhatsAppStep', () => {
  const mockConnectWhatsapp = vi.fn()
  const mockCheckWhatsappStatus = vi.fn()
  const mockCompleteSetup = vi.fn()
  const onComplete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders whatsapp step and initiates connection', async () => {
    mockConnectWhatsapp.mockResolvedValue({
      instanceName: 't-1',
      qrcodeBase64: 'data:image/png;base64,mockqr',
      status: 'PENDING',
    })

    vi.mocked(useTenantStore).mockReturnValue({
      tenant: { id: 't-1' } as any,
      connectWhatsapp: mockConnectWhatsapp,
      checkWhatsappStatus: mockCheckWhatsappStatus,
      completeSetup: mockCompleteSetup,
      qrCode: 'data:image/png;base64,mockqr',
      whatsappStatus: 'PENDING',
      isLoading: false,
      error: null,
      fetchTenant: vi.fn(),
      updateBranding: vi.fn(),
      uploadLogo: vi.fn(),
      setPrimaryColorPreview: vi.fn(),
    })

    render(<WhatsAppStep onComplete={onComplete} />)

    expect(screen.getByTestId('whatsapp-step')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByTestId('whatsapp-qr-image')).toBeInTheDocument()
    })
    expect(mockConnectWhatsapp).toHaveBeenCalled()
  })

  it('displays connected badge when whatsappStatus is CONNECTED', () => {
    vi.mocked(useTenantStore).mockReturnValue({
      tenant: { id: 't-1' } as any,
      connectWhatsapp: mockConnectWhatsapp,
      checkWhatsappStatus: mockCheckWhatsappStatus,
      completeSetup: mockCompleteSetup,
      qrCode: null,
      whatsappStatus: 'CONNECTED',
      isLoading: false,
      error: null,
      fetchTenant: vi.fn(),
      updateBranding: vi.fn(),
      uploadLogo: vi.fn(),
      setPrimaryColorPreview: vi.fn(),
    })

    render(<WhatsAppStep onComplete={onComplete} />)

    expect(screen.getByTestId('whatsapp-connected-badge')).toBeInTheDocument()
  })

  it('completes setup on finish button click', async () => {
    mockCompleteSetup.mockResolvedValue({})
    vi.mocked(useTenantStore).mockReturnValue({
      tenant: { id: 't-1' } as any,
      connectWhatsapp: mockConnectWhatsapp,
      checkWhatsappStatus: mockCheckWhatsappStatus,
      completeSetup: mockCompleteSetup,
      qrCode: 'data:image/png;base64,mockqr',
      whatsappStatus: 'CONNECTED',
      isLoading: false,
      error: null,
      fetchTenant: vi.fn(),
      updateBranding: vi.fn(),
      uploadLogo: vi.fn(),
      setPrimaryColorPreview: vi.fn(),
    })

    render(<WhatsAppStep onComplete={onComplete} />)

    const finishButton = screen.getByTestId('finish-setup-button')
    fireEvent.click(finishButton)

    await waitFor(() => {
      expect(mockCompleteSetup).toHaveBeenCalled()
      expect(onComplete).toHaveBeenCalled()
    })
  })
})
