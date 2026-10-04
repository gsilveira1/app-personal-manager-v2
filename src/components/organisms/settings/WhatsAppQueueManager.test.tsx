import '@testing-library/jest-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WhatsAppQueueManager } from './WhatsAppQueueManager'
import * as messagingApi from '../../../services/api/messagingApi'

vi.mock('../../../services/api/messagingApi', () => ({
  getTenantQueue: vi.fn(),
  retryMessage: vi.fn(),
  cancelMessage: vi.fn(),
  processPendingQueue: vi.fn(),
}))

describe('WhatsAppQueueManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders queue metrics and items', async () => {
    vi.mocked(messagingApi.getTenantQueue).mockResolvedValue({
      items: [
        {
          id: 'log-1',
          recipientPhone: '11999999999',
          templateType: 'WELCOME_ANAMNESIS',
          status: 'QUEUED',
          channel: 'WHATSAPP',
          error: null,
          createdAt: '2026-09-20T10:00:00.000Z',
          updatedAt: '2026-09-20T10:00:00.000Z',
        },
      ],
      total: 1,
      page: 1,
      totalPages: 1,
      summary: {
        totalQueued: 1,
        totalSent: 10,
        totalFailed: 2,
        totalCancelled: 0,
      },
    })

    render(<WhatsAppQueueManager />)

    await waitFor(() => {
      expect(screen.getByText('Fila & Gestão de Disparos WhatsApp')).toBeInTheDocument()
      expect(screen.getByText('11999999999')).toBeInTheDocument()
      expect(screen.getByText('Boas-Vindas & Anamnese')).toBeInTheDocument()
    })
  })

  it('allows retrying a queued message', async () => {
    vi.mocked(messagingApi.getTenantQueue).mockResolvedValue({
      items: [
        {
          id: 'log-1',
          recipientPhone: '11999999999',
          templateType: 'WORKOUT_LINK',
          status: 'QUEUED',
          channel: 'WHATSAPP',
          error: null,
          createdAt: '2026-09-20T10:00:00.000Z',
          updatedAt: '2026-09-20T10:00:00.000Z',
        },
      ],
      total: 1,
      page: 1,
      totalPages: 1,
      summary: { totalQueued: 1, totalSent: 0, totalFailed: 0, totalCancelled: 0 },
    })
    vi.mocked(messagingApi.retryMessage).mockResolvedValue({
      message: 'Disparo reprocessado com sucesso!',
      notification: {
        id: 'log-1',
        recipientPhone: '11999999999',
        templateType: 'WORKOUT_LINK',
        status: 'SENT',
        channel: 'WHATSAPP',
        createdAt: '2026-09-20T10:00:00.000Z',
        updatedAt: '2026-09-20T10:05:00.000Z',
      },
    })

    const user = userEvent.setup()
    render(<WhatsAppQueueManager />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Reenviar/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /Reenviar/i }))

    await waitFor(() => {
      expect(messagingApi.retryMessage).toHaveBeenCalledWith('log-1')
      expect(screen.getByText('Disparo reprocessado com sucesso!')).toBeInTheDocument()
    })
  })

  it('allows forcing pending queue dispatch', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    vi.mocked(messagingApi.getTenantQueue).mockResolvedValue({
      items: [
        {
          id: 'log-1',
          recipientPhone: '11999999999',
          templateType: 'WORKOUT_LINK',
          status: 'QUEUED',
          channel: 'WHATSAPP',
          error: null,
          createdAt: '2026-09-20T10:00:00.000Z',
          updatedAt: '2026-09-20T10:00:00.000Z',
        },
      ],
      total: 1,
      page: 1,
      totalPages: 1,
      summary: { totalQueued: 1, totalSent: 0, totalFailed: 0, totalCancelled: 0 },
    })
    vi.mocked(messagingApi.processPendingQueue).mockResolvedValue({
      processedCount: 1,
      successCount: 1,
      failedCount: 0,
      delayedCount: 0,
      message: 'Disparos processados com sucesso.',
    })

    const user = userEvent.setup()
    render(<WhatsAppQueueManager />)

    await waitFor(() => {
      expect(screen.getByTestId('force-dispatch-btn')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('force-dispatch-btn'))

    await waitFor(() => {
      expect(messagingApi.processPendingQueue).toHaveBeenCalledWith(true)
      expect(screen.getByText(/Fila processada: 1 enviada\(s\)/i)).toBeInTheDocument()
    })
  })
})
