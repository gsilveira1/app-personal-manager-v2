import { useEffect, useState } from 'react'
import { MessageSquare, Mail, RefreshCw, AlertCircle, CheckCircle2, Clock, XCircle, Search, RotateCcw, Ban } from 'lucide-react'

const PENDING_STATE_LABEL: Record<PendingNotification['state'], string> = {
  waiting: 'Aguardando envio',
  delayed: 'Agendada',
  active: 'Enviando',
}

const errorText = (err: unknown, fallback: string) => (err instanceof Error && err.message ? err.message : fallback)
import { Card, Button, Input, Select, Spinner } from '../../atoms'
import * as messagingApi from '../../../services/api/messagingApi'
import type { MessageLogSummary, NotificationLogItem, PendingNotification } from '../../../services/api/messagingApi'

export const WhatsAppQueueManager = () => {
  const [items, setItems] = useState<NotificationLogItem[]>([])
  const [pending, setPending] = useState<PendingNotification[]>([])
  const [summary, setSummary] = useState<MessageLogSummary>({
    totalPending: 0,
    totalSent: 0,
    totalFailed: 0,
    totalCancelled: 0,
  })
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [channelFilter, setChannelFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // The audit log and the live queue are separate reads: the queue can be down (503)
  // while the history is still available, so each failure is reported on its own.
  const loadLogs = async () => {
    try {
      const data = await messagingApi.getMessageLogs({
        status: statusFilter as 'ALL' | 'SENT' | 'FAILED' | 'CANCELLED',
        channel: channelFilter,
        search: searchQuery,
        page,
        limit: 10,
      })
      setItems(data.items)
      setSummary(data.summary)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch (err) {
      console.error('Error loading notification log:', err)
      setFeedback({ type: 'error', text: errorText(err, 'Erro ao carregar o histórico de disparos.') })
    }
  }

  const loadPending = async () => {
    try {
      setPending(await messagingApi.getPendingMessages())
    } catch (err) {
      console.error('Error loading pending notifications:', err)
      setFeedback({ type: 'error', text: errorText(err, 'Erro ao carregar a fila de disparos pendentes.') })
    }
  }

  const loadQueue = async () => {
    setIsLoading(true)
    await Promise.all([loadLogs(), loadPending()])
    setIsLoading(false)
  }

  useEffect(() => {
    loadQueue()
  }, [page, statusFilter, channelFilter])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    loadQueue()
  }

  const handleCancel = async (jobId: string) => {
    if (!confirm('Deseja realmente cancelar este disparo pendente na fila?')) return
    setActionInProgressId(jobId)
    setFeedback(null)
    try {
      await messagingApi.cancelPendingMessage(jobId)
      await loadQueue()
      setFeedback({ type: 'success', text: 'Disparo cancelado com sucesso!' })
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Erro ao cancelar disparo.' })
    } finally {
      setActionInProgressId(null)
    }
  }

  const getTemplateLabel = (templateType: string) => {
    switch (templateType) {
      case 'WELCOME_ANAMNESIS':
        return 'Boas-Vindas & Anamnese'
      case 'WORKOUT_LINK':
        return 'Link da Ficha'
      case 'EXPIRATION_ALERT':
        return 'Alerta de Vencimento'
      default:
        return templateType
    }
  }

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'SENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" />
            Enviado
          </span>
        )
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
            <AlertCircle className="h-3 w-3" />
            Falha
          </span>
        )
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            <XCircle className="h-3 w-3" />
            Cancelado
          </span>
        )
      default:
        return <span className="text-xs">{status}</span>
    }
  }

  const [isProcessingQueue, setIsProcessingQueue] = useState(false)

  const handleForceDispatch = async () => {
    if (!confirm('Deseja enviar agora as mensagens agendadas, ignorando o horário de não perturbe?')) return
    setIsProcessingQueue(true)
    setFeedback(null)
    try {
      const res = await messagingApi.flushPendingMessages()
      await loadQueue()
      setFeedback({
        type: 'success',
        text: `${res.promotedCount} mensagem(ns) liberada(s) para envio. ${res.message || ''}`.trim(),
      })
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Erro ao forçar processamento da fila.' })
    } finally {
      setIsProcessingQueue(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header & Metrics */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-emerald-600" />
            Fila & Gestão de Disparos WhatsApp
          </h2>
          <p className="text-xs text-slate-500">Monitore as notificações automáticas da sua consultoria e cancele as que ainda não saíram. Falhas temporárias são reenviadas automaticamente.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleForceDispatch}
            disabled={isProcessingQueue || isLoading || !pending.some((p) => p.state === 'delayed')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            data-testid="force-dispatch-btn"
          >
            {isProcessingQueue ? <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5 mr-1.5" />}
            Forçar Envio
          </Button>
          <Button variant="outline" size="sm" onClick={loadQueue} disabled={isLoading || isProcessingQueue}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar Fila
          </Button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-md text-xs font-medium ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}
        >
          {feedback.text}
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3.5 bg-amber-50/50 border-amber-200/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-800">Na Fila</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-900 mt-1">{summary.totalPending}</p>
        </Card>

        <Card className="p-3.5 bg-emerald-50/50 border-emerald-200/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-800">Enviadas</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-900 mt-1">{summary.totalSent}</p>
        </Card>

        <Card className="p-3.5 bg-red-50/50 border-red-200/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-red-800">Falhas</span>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-red-900 mt-1">{summary.totalFailed}</p>
        </Card>

        <Card className="p-3.5 bg-slate-50 border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-700">Canceladas</span>
            <XCircle className="h-4 w-4 text-slate-500" />
          </div>
          <p className="text-2xl font-bold text-slate-800 mt-1">{summary.totalCancelled}</p>
        </Card>
      </div>

      {/* Pending queue */}
      {pending.length > 0 && (
        <Card className="overflow-hidden" data-testid="pending-notifications">
          <div className="px-4 py-3 border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-600">Na fila ({pending.length})</div>
          <ul className="divide-y divide-slate-100 text-xs">
            {pending.map((job) => (
              <li key={job.jobId} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <div>
                  <span className="font-mono font-medium text-slate-900">{job.recipientPhone}</span>
                  <span className="ml-2 font-medium text-slate-700">{getTemplateLabel(job.templateType)}</span>
                  <p className="text-slate-500">
                    {PENDING_STATE_LABEL[job.state]}
                    {job.scheduledFor && ` para ${new Date(job.scheduledFor).toLocaleString('pt-BR')}`}
                    {job.attemptsMade > 0 && ` • ${job.attemptsMade} tentativa(s)`}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCancel(job.jobId)}
                  disabled={actionInProgressId === job.jobId || job.state === 'active'}
                  className="h-7 px-2 text-xs text-red-600 hover:bg-red-50 border-red-200"
                  title="Cancelar Disparo da Fila"
                >
                  <Ban className="h-3 w-3 mr-1" />
                  Cancelar
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Filters & Search */}
      <Card className="p-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input type="text" placeholder="Buscar por telefone, modelo ou erro..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 text-xs" />
          </div>

          <div className="w-36">
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="text-xs"
            >
              <option value="ALL">Status: Todos</option>
              <option value="SENT">Enviadas</option>
              <option value="FAILED">Falhas</option>
              <option value="CANCELLED">Canceladas</option>
            </Select>
          </div>

          <div className="w-36">
            <Select
              value={channelFilter}
              onChange={(e) => {
                setChannelFilter(e.target.value)
                setPage(1)
              }}
              className="text-xs"
            >
              <option value="ALL">Canal: Todos</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="EMAIL">E-mail</option>
            </Select>
          </div>

          <Button type="submit" size="sm" variant="outline">
            Filtrar
          </Button>
        </form>
      </Card>

      {/* Queue Table */}
      <Card className="overflow-hidden">
        {isLoading && items.length === 0 ? (
          <div className="flex justify-center items-center h-48">
            <Spinner />
          </div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <MessageSquare className="h-8 w-8 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium">Nenhuma notificação encontrada com os filtros selecionados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Data / Hora</th>
                  <th className="py-3 px-4">Destinatário</th>
                  <th className="py-3 px-4">Modelo</th>
                  <th className="py-3 px-4">Canal</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{new Date(item.createdAt).toLocaleString('pt-BR')}</td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">{item.recipientPhone}</td>
                    <td className="py-3 px-4 text-slate-700 font-medium">{getTemplateLabel(item.templateType)}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 font-medium ${item.channel === 'WHATSAPP' ? 'text-emerald-700' : 'text-blue-700'}`}>
                        {item.channel === 'WHATSAPP' ? <MessageSquare className="h-3 w-3" /> : <Mail className="h-3 w-3" />}
                        {item.channel}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">{renderStatusBadge(item.status)}</td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate" title={item.error || 'Nenhum erro registrado'}>
                      {item.error || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Total de <strong>{total}</strong> disparos • Página <strong>{page}</strong> de <strong>{totalPages}</strong>
            </span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1 || isLoading} className="h-7 px-2 text-xs">
                Anterior
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages || isLoading} className="h-7 px-2 text-xs">
                Próxima
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
