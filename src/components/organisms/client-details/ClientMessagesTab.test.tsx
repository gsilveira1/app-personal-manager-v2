import '@testing-library/jest-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ClientMessagesTab } from './ClientMessagesTab'
import * as messagingApi from '../../../services/api/messagingApi'
import type { Client } from '../../../types'

vi.mock('../../../services/api/messagingApi', () => ({
  getClientMessageHistory: vi.fn(),
  retryMessage: vi.fn(),
}))

const mockClient: Client = {
  id: 'client-1',
  userId: 'user-1',
  name: 'Maria Silva',
  email: 'maria@test.com',
  phone: '11999999999',
  status: 'ACTIVE',
  modality: 'PRESENCIAL',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  notificationEnabled: true,
}

describe('ClientMessagesTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state and then message history', async () => {
    vi.mocked(messagingApi.getClientMessageHistory).mockResolvedValue([
      {
        id: 'msg-1',
        recipientPhone: '11999999999',
        templateType: 'WELCOME_ANAMNESIS',
        status: 'SENT',
        channel: 'WHATSAPP',
        error: null,
        createdAt: '2026-09-20T10:00:00.000Z',
        updatedAt: '2026-09-20T10:00:00.000Z',
      },
    ])

    render(<ClientMessagesTab client={mockClient} />)

    await waitFor(() => {
      expect(screen.getByText('Boas-Vindas & Anamnese')).toBeInTheDocument()
      expect(screen.getByText('Enviado')).toBeInTheDocument()
      expect(screen.getByText('WHATSAPP')).toBeInTheDocument()
    })
  })

  it('renders empty state when no messages exist', async () => {
    vi.mocked(messagingApi.getClientMessageHistory).mockResolvedValue([])

    render(<ClientMessagesTab client={mockClient} />)

    await waitFor(() => {
      expect(screen.getByText('Nenhuma mensagem registrada ainda.')).toBeInTheDocument()
    })
  })

  it('allows retrying failed messages', async () => {
    vi.mocked(messagingApi.getClientMessageHistory).mockResolvedValue([
      {
        id: 'msg-failed',
        recipientPhone: '11999999999',
        templateType: 'WORKOUT_LINK',
        status: 'FAILED',
        channel: 'WHATSAPP',
        error: 'WhatsApp timeout',
        createdAt: '2026-09-20T10:00:00.000Z',
        updatedAt: '2026-09-20T10:00:00.000Z',
      },
    ])
    vi.mocked(messagingApi.retryMessage).mockResolvedValue({
      message: 'Disparo reprocessado com sucesso!',
      notification: {
        id: 'msg-failed',
        recipientPhone: '11999999999',
        templateType: 'WORKOUT_LINK',
        status: 'SENT',
        channel: 'WHATSAPP',
        createdAt: '2026-09-20T10:00:00.000Z',
        updatedAt: '2026-09-20T10:05:00.000Z',
      },
    })

    const user = userEvent.setup()
    render(<ClientMessagesTab client={mockClient} />)

    await waitFor(() => {
      expect(screen.getByText('Falha')).toBeInTheDocument()
    })

    const retryBtn = screen.getByRole('button', { name: /Tentar Novamente/i })
    await user.click(retryBtn)

    await waitFor(() => {
      expect(messagingApi.retryMessage).toHaveBeenCalledWith('msg-failed')
      expect(screen.getByText('Disparo reprocessado com sucesso!')).toBeInTheDocument()
    })
  })
})
