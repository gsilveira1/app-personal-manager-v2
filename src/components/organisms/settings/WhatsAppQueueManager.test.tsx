import '@testing-library/jest-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WhatsAppQueueManager } from './WhatsAppQueueManager'
import * as messagingApi from '../../../services/api/messagingApi'
import type { MessageLogPage, NotificationLogItem, PendingNotification } from '../../../services/api/messagingApi'

vi.mock('../../../services/api/messagingApi', () => ({
  getMessageLogs: vi.fn(),
  getPendingMessages: vi.fn(),
  flushPendingMessages: vi.fn(),
  cancelPendingMessage: vi.fn(),
}))

const logItem = (overrides: Partial<NotificationLogItem> = {}): NotificationLogItem => ({
  id: 'log-1',
  userId: 'user-1',
  clientId: 'client-1',
  jobId: 'job-0',
  recipientPhone: '11999999999',
  templateType: 'WELCOME_ANAMNESIS',
  status: 'SENT',
  channel: 'WHATSAPP',
  error: null,
  createdAt: '2026-09-20T10:00:00.000Z',
  updatedAt: '2026-09-20T10:00:00.000Z',
  ...overrides,
})

const logPage = (items: NotificationLogItem[], summary: Partial<MessageLogPage['summary']> = {}): MessageLogPage => ({
  items,
  total: items.length,
  page: 1,
  totalPages: 1,
  summary: { totalSent: 0, totalFailed: 0, totalCancelled: 0, totalPending: 0, ...summary },
})

const pendingJob = (overrides: Partial<PendingNotification> = {}): PendingNotification => ({
  jobId: 'job-1',
  templateType: 'WORKOUT_LINK',
  recipientPhone: '11888888888',
  clientId: 'client-1',
  state: 'delayed',
  scheduledFor: '2026-09-21T11:00:00.000Z',
  attemptsMade: 0,
  requestedAt: '2026-09-20T23:00:00.000Z',
  ...overrides,
})

describe('WhatsAppQueueManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(messagingApi.getMessageLogs).mockResolvedValue(logPage([]))
    vi.mocked(messagingApi.getPendingMessages).mockResolvedValue([])
  })

  it('renders the audit log with its totals, pending count included', async () => {
    vi.mocked(messagingApi.getMessageLogs).mockResolvedValue(logPage([logItem()], { totalSent: 10, totalFailed: 2, totalPending: 3 }))

    render(<WhatsAppQueueManager />)

    await waitFor(() => {
      expect(screen.getByText('11999999999')).toBeInTheDocument()
    })
    expect(screen.getByText('Fila & Gestão de Disparos WhatsApp')).toBeInTheDocument()
    expect(screen.getByText('Boas-Vindas & Anamnese')).toBeInTheDocument()
    expect(screen.getByText('Enviado')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(messagingApi.getMessageLogs).toHaveBeenCalledWith(expect.objectContaining({ status: 'ALL', page: 1, limit: 10 }))
  })

  it('offers no manual retry: failed deliveries are retried by the queue', async () => {
    vi.mocked(messagingApi.getMessageLogs).mockResolvedValue(
      logPage([logItem({ status: 'FAILED', error: 'WHATSAPP_TRANSIENT (HTTP 503): upstream unavailable' })], {
        totalFailed: 1,
      })
    )

    render(<WhatsAppQueueManager />)

    await waitFor(() => {
      expect(screen.getByText('Falha')).toBeInTheDocument()
    })
    expect(screen.queryByRole('button', { name: /Reenviar/i })).not.toBeInTheDocument()
  })

  it('lists pending jobs and cancels one by its job id', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    vi.mocked(messagingApi.getPendingMessages).mockResolvedValue([pendingJob()])
    vi.mocked(messagingApi.cancelPendingMessage).mockResolvedValue({
      message: 'ok',
      notification: logItem({ status: 'CANCELLED', jobId: 'job-1' }),
    })

    const user = userEvent.setup()
    render(<WhatsAppQueueManager />)

    const pending = await screen.findByTestId('pending-notifications')
    expect(within(pending).getByText('11888888888')).toBeInTheDocument()
    expect(within(pending).getByText('Link da Ficha')).toBeInTheDocument()

    await user.click(within(pending).getByRole('button', { name: /Cancelar/i }))

    await waitFor(() => {
      expect(messagingApi.cancelPendingMessage).toHaveBeenCalledWith('job-1')
      expect(screen.getByText('Disparo cancelado com sucesso!')).toBeInTheDocument()
    })
  })

  it('does not let a job that is already being sent be cancelled', async () => {
    vi.mocked(messagingApi.getPendingMessages).mockResolvedValue([pendingJob({ state: 'active', scheduledFor: null })])

    render(<WhatsAppQueueManager />)

    const pending = await screen.findByTestId('pending-notifications')
    expect(within(pending).getByRole('button', { name: /Cancelar/i })).toBeDisabled()
  })

  it('flushes the delayed jobs and reports how many were promoted', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    vi.mocked(messagingApi.getPendingMessages).mockResolvedValue([pendingJob()])
    vi.mocked(messagingApi.flushPendingMessages).mockResolvedValue({
      promotedCount: 1,
      message: 'Mensagens liberadas.',
    })

    const user = userEvent.setup()
    render(<WhatsAppQueueManager />)

    await waitFor(() => {
      expect(screen.getByTestId('force-dispatch-btn')).toBeEnabled()
    })
    await user.click(screen.getByTestId('force-dispatch-btn'))

    await waitFor(() => {
      expect(messagingApi.flushPendingMessages).toHaveBeenCalledTimes(1)
      expect(screen.getByText(/1 mensagem\(ns\) liberada\(s\) para envio/i)).toBeInTheDocument()
    })
  })

  it('keeps the flush button off when nothing is being held back', async () => {
    vi.mocked(messagingApi.getPendingMessages).mockResolvedValue([pendingJob({ state: 'waiting', scheduledFor: null })])

    render(<WhatsAppQueueManager />)

    await screen.findByTestId('pending-notifications')
    expect(screen.getByTestId('force-dispatch-btn')).toBeDisabled()
  })

  it('shows the history and reports the failure when the queue is unreachable', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(messagingApi.getMessageLogs).mockResolvedValue(logPage([logItem()], { totalSent: 1 }))
    vi.mocked(messagingApi.getPendingMessages).mockRejectedValue(new Error('Fila de notificações indisponível'))

    render(<WhatsAppQueueManager />)

    await waitFor(() => {
      expect(screen.getByText('Fila de notificações indisponível')).toBeInTheDocument()
    })
    expect(screen.getByText('11999999999')).toBeInTheDocument()
  })
})
