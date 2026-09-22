import '@testing-library/jest-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ResendMagicLinkModal } from './ResendMagicLinkModal'
import * as api from '../../../services/api/apiService'

vi.mock('../../../services/api/apiService', () => ({
  resendStudentLink: vi.fn(),
}))

const mockClient: any = {
  id: 'client-123',
  name: 'João Silva',
  phone: '11999998888',
  email: 'joao@test.com',
}

describe('ResendMagicLinkModal Component', () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders correctly when open with options for workout sheet and anamnesis', () => {
    render(<ResendMagicLinkModal isOpen={true} onClose={mockOnClose} client={mockClient} />)

    expect(screen.getByText('Enviar Link Mágico para Aluno')).toBeInTheDocument()
    expect(screen.getByText('Ficha de Treino')).toBeInTheDocument()
    expect(screen.getByText('Anamnese de Saúde')).toBeInTheDocument()
    expect(screen.getByText('Enviar Agora')).toBeInTheDocument()
  })

  it('does not render when isOpen is false', () => {
    render(<ResendMagicLinkModal isOpen={false} onClose={mockOnClose} client={mockClient} />)

    expect(screen.queryByText('Enviar Link Mágico para Aluno')).not.toBeInTheDocument()
  })

  it('sends workout sheet link and displays success result', async () => {
    vi.mocked(api.resendStudentLink).mockResolvedValueOnce({
      status: 'SENT',
      message: 'Mensagem enviada com sucesso.',
      channel: 'WHATSAPP',
      scheduledDelayMs: 0,
      link: '/#/p/portal?token=workout-token-123',
    })

    render(<ResendMagicLinkModal isOpen={true} onClose={mockOnClose} client={mockClient} />)

    fireEvent.click(screen.getByText('Ficha de Treino'))
    fireEvent.click(screen.getByText('Enviar Agora'))

    await waitFor(() => {
      expect(api.resendStudentLink).toHaveBeenCalledWith('client-123', 'WORKOUT_SHEET')
      expect(screen.getByText('Enviado com sucesso!')).toBeInTheDocument()
    })

    expect(screen.getByDisplayValue(/workout-token-123/)).toBeInTheDocument()
  })

  it('allows sending multiple times: send workout sheet, then send anamnesis via "Enviar outro link"', async () => {
    vi.mocked(api.resendStudentLink)
      .mockResolvedValueOnce({
        status: 'SENT',
        message: 'Ficha enviada.',
        channel: 'WHATSAPP',
        scheduledDelayMs: 0,
        link: '/#/p/portal?token=workout-token-123',
      })
      .mockResolvedValueOnce({
        status: 'SENT',
        message: 'Anamnese enviada.',
        channel: 'WHATSAPP',
        scheduledDelayMs: 0,
        link: '/#/anamnesis?token=anamnesis-token-456',
      })

    render(<ResendMagicLinkModal isOpen={true} onClose={mockOnClose} client={mockClient} />)

    // 1st dispatch: Workout Sheet
    fireEvent.click(screen.getByText('Ficha de Treino'))
    fireEvent.click(screen.getByText('Enviar Agora'))

    await waitFor(() => {
      expect(screen.getByText('Enviado com sucesso!')).toBeInTheDocument()
    })

    // Click "Enviar outro link" to send again without closing
    const sendAnotherBtn = screen.getByRole('button', { name: /enviar outro link/i })
    expect(sendAnotherBtn).toBeInTheDocument()
    fireEvent.click(sendAnotherBtn)

    // Form should be back with both options available
    expect(screen.getByText('Ficha de Treino')).toBeInTheDocument()
    expect(screen.getByText('Anamnese de Saúde')).toBeInTheDocument()

    // 2nd dispatch: Anamnesis
    fireEvent.click(screen.getByText('Anamnese de Saúde'))
    fireEvent.click(screen.getByText('Enviar Agora'))

    await waitFor(() => {
      expect(api.resendStudentLink).toHaveBeenCalledWith('client-123', 'ANAMNESIS')
      expect(screen.getByText('Enviado com sucesso!')).toBeInTheDocument()
    })

    expect(screen.getByDisplayValue(/anamnesis-token-456/)).toBeInTheDocument()
  })

  it('resets state when modal is closed and reopened so it can be used multiple times', async () => {
    vi.mocked(api.resendStudentLink).mockResolvedValueOnce({
      status: 'SENT',
      message: 'Ficha enviada.',
      channel: 'WHATSAPP',
      scheduledDelayMs: 0,
      link: '/#/p/portal?token=workout-token-123',
    })

    const { rerender } = render(
      <ResendMagicLinkModal isOpen={true} onClose={mockOnClose} client={mockClient} />
    )

    // Dispatch Workout Sheet
    fireEvent.click(screen.getByText('Ficha de Treino'))
    fireEvent.click(screen.getByText('Enviar Agora'))

    await waitFor(() => {
      expect(screen.getByText('Enviado com sucesso!')).toBeInTheDocument()
    })

    // Simulate closing the modal
    fireEvent.click(screen.getByRole('button', { name: /fechar/i }))
    expect(mockOnClose).toHaveBeenCalled()

    // Rerender as closed
    rerender(<ResendMagicLinkModal isOpen={false} onClose={mockOnClose} client={mockClient} />)
    expect(screen.queryByText('Enviar Link Mágico para Aluno')).not.toBeInTheDocument()

    // Rerender as reopened
    rerender(<ResendMagicLinkModal isOpen={true} onClose={mockOnClose} client={mockClient} />)

    // Should NOT show stale success screen, but the fresh selection form
    expect(screen.getByText('Ficha de Treino')).toBeInTheDocument()
    expect(screen.getByText('Anamnese de Saúde')).toBeInTheDocument()
    expect(screen.getByText('Enviar Agora')).toBeInTheDocument()
    expect(screen.queryByText('Enviado com sucesso!')).not.toBeInTheDocument()
  })
})
