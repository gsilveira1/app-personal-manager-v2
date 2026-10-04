import '@testing-library/jest-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WhatsAppConnectionCard } from './WhatsAppConnectionCard'
import { useAccountStore } from '../../../states/stores/account/accountStore'

vi.mock('../../../states/stores/account/accountStore', () => ({
  useAccountStore: vi.fn(),
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'connection.title': 'Instância Evolution API (WhatsApp)',
        'connection.description': 'Conecte seu número de WhatsApp',
        'connection.statusConnected': 'Conectado',
        'connection.statusDisconnected': 'Desconectado',
        'connection.statusConnecting': 'Conectando',
        'connection.connectedMessage': 'Sua instância está ativa',
        'connection.instanceName': 'Nome da Instância',
        'connection.instructionsTitle': 'Como conectar seu WhatsApp:',
        'connection.step1': 'Passo 1',
        'connection.step2': 'Passo 2',
        'connection.step3': 'Passo 3',
        'connection.refreshQr': 'Atualizar QR Code',
        'connection.disconnectButton': 'Desconectar Sessão',
        'connection.disconnectConfirm': 'Tem certeza que deseja desconectar?',
        'connection.testMessageButton': 'Enviar Mensagem de Teste',
        'connection.testModalTitle': 'Teste de Envio WhatsApp',
        'connection.testModalSubtitle': 'Envie uma mensagem instantânea',
        'connection.phoneLabel': 'Número de Telefone',
        'connection.phonePlaceholder': '(11) 99999-8888',
        'connection.messageLabel': 'Mensagem de Teste',
        'connection.messageDefault': 'Mensagem de teste padrão',
        'connection.sendTest': 'Enviar Teste',
        'connection.sending': 'Enviando...',
        'connection.testSuccess': 'Mensagem de teste enviada com sucesso! ID:',
        'connection.testError': 'Erro ao enviar mensagem de teste:',
      }
      return translations[key] || key
    },
  }),
}))

describe('WhatsAppConnectionCard', () => {
  const mockFetchAccount = vi.fn()
  const mockConnectWhatsapp = vi.fn()
  const mockCheckWhatsappStatus = vi.fn()
  const mockDisconnectWhatsapp = vi.fn()
  const mockSendTestWhatsappMessage = vi.fn()

  const defaultStoreState = {
    account: { id: 't-1', name: 'Studio', whatsappInstanceName: 'vivi-instance-1' },
    fetchAccount: mockFetchAccount,
    connectWhatsapp: mockConnectWhatsapp,
    checkWhatsappStatus: mockCheckWhatsappStatus,
    disconnectWhatsapp: mockDisconnectWhatsapp,
    sendTestWhatsappMessage: mockSendTestWhatsappMessage,
    qrCode: 'data:image/png;base64,mock_qr',
    whatsappStatus: 'DISCONNECTED',
    isLoading: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAccountStore).mockReturnValue(defaultStoreState as any)
  })

  it('renders disconnected state with QR code container and refresh button', async () => {
    render(<WhatsAppConnectionCard />)

    expect(screen.getByText('Instância Evolution API (WhatsApp)')).toBeInTheDocument()
    expect(screen.getByText('vivi-instance-1')).toBeInTheDocument()
    expect(screen.getByTestId('notifications-qr-container')).toBeInTheDocument()
    expect(screen.getByTestId('notifications-refresh-qr-btn')).toBeInTheDocument()
  })

  it('renders connected state with test button and disconnect button', async () => {
    vi.mocked(useAccountStore).mockReturnValue({
      ...defaultStoreState,
      whatsappStatus: 'CONNECTED',
    } as any)

    render(<WhatsAppConnectionCard />)

    expect(screen.getByTestId('whatsapp-connected-panel')).toBeInTheDocument()
    expect(screen.getByTestId('open-test-message-modal-btn')).toBeInTheDocument()
    expect(screen.getByTestId('disconnect-whatsapp-btn')).toBeInTheDocument()
  })

  it('handles disconnect action with confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    vi.mocked(useAccountStore).mockReturnValue({
      ...defaultStoreState,
      whatsappStatus: 'CONNECTED',
    } as any)

    const user = userEvent.setup()
    render(<WhatsAppConnectionCard />)

    const disconnectBtn = screen.getByTestId('disconnect-whatsapp-btn')
    await user.click(disconnectBtn)

    expect(window.confirm).toHaveBeenCalled()
    expect(mockDisconnectWhatsapp).toHaveBeenCalled()
  })

  it('opens test message modal and dispatches test message', async () => {
    mockSendTestWhatsappMessage.mockResolvedValue({ success: true, messageId: 'msg-999' })
    vi.mocked(useAccountStore).mockReturnValue({
      ...defaultStoreState,
      whatsappStatus: 'CONNECTED',
    } as any)

    const user = userEvent.setup()
    render(<WhatsAppConnectionCard />)

    await user.click(screen.getByTestId('open-test-message-modal-btn'))

    expect(screen.getByTestId('test-message-modal')).toBeInTheDocument()

    const phoneInput = screen.getByTestId('test-phone-input')
    await user.type(phoneInput, '5511999998888')

    const submitBtn = screen.getByTestId('submit-test-message-btn')
    await user.click(submitBtn)

    await waitFor(() => {
      expect(mockSendTestWhatsappMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          phone: '5511999998888',
        })
      )
      expect(screen.getByText(/Mensagem de teste enviada com sucesso!/i)).toBeInTheDocument()
    })
  })
})
