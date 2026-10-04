import { useEffect, useState } from 'react'
import { MessageSquare, Mail, RefreshCw, AlertCircle, CheckCircle2, XCircle, Send } from 'lucide-react'
import { Card, Button, Badge, Spinner } from '../../../components/atoms'

import * as messagingApi from '../../../services/api/messagingApi'
import type { NotificationLogItem } from '../../../services/api/messagingApi'
import type { Client } from '../../../types'

interface ClientMessagesTabProps {
  client: Client
  onOpenResendModal?: () => void
}

export const ClientMessagesTab = ({ client, onOpenResendModal }: ClientMessagesTabProps) => {
  const [messages, setMessages] = useState<NotificationLogItem[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const loadMessages = async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const data = await messagingApi.getClientMessageHistory(client.id)
      setMessages(data)
    } catch (err) {
      console.error('Error loading message history:', { clientId: client.id, err })
      setLoadError(err instanceof Error && err.message ? err.message : 'Não foi possível carregar o histórico de mensagens.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadMessages()
  }, [client.id])

  const getTemplateLabel = (templateType: string) => {
    switch (templateType) {
      case 'WELCOME_ANAMNESIS':
        return 'Boas-Vindas & Anamnese'
      case 'WORKOUT_LINK':
        return 'Link da Ficha de Treinos'
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
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Histórico de Mensagens & Notificações</h3>
          <p className="text-xs text-slate-500">Comunicações automáticas e manuais enviadas via WhatsApp e E-mail para {client.name}.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadMessages} disabled={isLoading}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          {onOpenResendModal && (
            <Button size="sm" onClick={onOpenResendModal} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Send className="h-3.5 w-3.5 mr-1.5" />
              Enviar Link
            </Button>
          )}
        </div>
      </div>

      {loadError && (
        <div role="alert" className="p-3 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-red-200">
          {loadError}
        </div>
      )}

      {isLoading && messages.length === 0 ? (
        <div className="flex justify-center items-center h-48">
          <Spinner />
        </div>
      ) : messages.length === 0 ? (
        <Card className="p-8 text-center text-slate-500 bg-slate-50 border-dashed">
          <MessageSquare className="h-10 w-10 mx-auto text-slate-400 mb-2 opacity-60" />
          <p className="text-sm font-medium text-slate-700">Nenhuma mensagem registrada ainda.</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">Disparos automáticos de boas-vindas, fichas de treino ou alertas aparecerão aqui.</p>
          {onOpenResendModal && (
            <Button size="sm" variant="outline" onClick={onOpenResendModal} className="mt-4">
              <Send className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
              Enviar Primeiro Link
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => (
            <Card key={msg.id} className="p-4 transition hover:shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-lg ${msg.channel === 'WHATSAPP' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                    {msg.channel === 'WHATSAPP' ? <MessageSquare className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">{getTemplateLabel(msg.templateType)}</h4>
                    <p className="text-xs text-slate-500">
                      Destinatário: <span className="font-mono text-slate-700">{msg.recipientPhone}</span> • Canal: <span className="font-medium">{msg.channel}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {renderStatusBadge(msg.status)}
                  <span className="text-xs text-slate-400">{new Date(msg.createdAt).toLocaleString('pt-BR')}</span>

                  {/* Delivery retries are automatic. After a final failure the link is sent again, which issues a fresh one. */}
                  {msg.status === 'FAILED' && onOpenResendModal && (
                    <Button variant="outline" size="sm" onClick={onOpenResendModal} className="text-xs h-7 px-2">
                      <Send className="h-3 w-3 mr-1" />
                      Enviar Novo Link
                    </Button>
                  )}
                </div>
              </div>

              {msg.error && (
                <div className="mt-2.5 pt-2 border-t border-slate-100 text-xs text-red-600 bg-red-50/50 p-2 rounded">
                  <span className="font-semibold">Detalhe: </span>
                  {msg.error}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
