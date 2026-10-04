import '@testing-library/jest-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ClientMessagesTab } from './ClientMessagesTab'
import * as messagingApi from '../../../services/api/messagingApi'
import type { Client } from '../../../types'

vi.mock('../../../services/api/messagingApi', () => ({
  getClientMessageHistory: vi.fn(),
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
        userId: 'user-1',
        clientId: 'client-1',
        jobId: 'job-1',
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

  it('offers a fresh link for a failed message instead of a manual retry', async () => {
    vi.mocked(messagingApi.getClientMessageHistory).mockResolvedValue([
      {
        id: 'msg-failed',
        userId: 'user-1',
        clientId: 'client-1',
        jobId: 'job-2',
        recipientPhone: '11999999999',
        templateType: 'WORKOUT_LINK',
        status: 'FAILED',
        channel: 'WHATSAPP',
        error: 'WHATSAPP_NOT_CONNECTED',
        createdAt: '2026-09-20T10:00:00.000Z',
        updatedAt: '2026-09-20T10:00:00.000Z',
      },
    ])
    const onOpenResendModal = vi.fn()

    const user = userEvent.setup()
    render(<ClientMessagesTab client={mockClient} onOpenResendModal={onOpenResendModal} />)

    await waitFor(() => {
      expect(screen.getByText('Falha')).toBeInTheDocument()
    })
    expect(screen.getByText('WHATSAPP_NOT_CONNECTED')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Tentar Novamente/i })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Enviar Novo Link/i }))

    expect(onOpenResendModal).toHaveBeenCalledTimes(1)
  })

  it('reads the history by client id', async () => {
    vi.mocked(messagingApi.getClientMessageHistory).mockResolvedValue([])

    render(<ClientMessagesTab client={mockClient} />)

    await waitFor(() => {
      expect(messagingApi.getClientMessageHistory).toHaveBeenCalledWith('client-1')
    })
  })

  it('reports a failed load instead of showing an empty history', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(messagingApi.getClientMessageHistory).mockRejectedValue(new Error('Request failed with status 500'))

    render(<ClientMessagesTab client={mockClient} />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Request failed with status 500')
  })
})
