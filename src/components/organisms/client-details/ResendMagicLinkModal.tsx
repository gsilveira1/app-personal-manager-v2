import { useState, useEffect, useCallback } from 'react'
import { Send, CheckCircle2, MessageCircle, AlertCircle, Copy, Check, RefreshCw } from 'lucide-react'
import { Card, Button } from '../../atoms'
import * as api from '../../../services/api/apiService'
import type { Client } from '../../../types'

interface ResendMagicLinkModalProps {
  isOpen: boolean
  onClose: () => void
  client: Client
}

export const ResendMagicLinkModal = ({ isOpen, onClose, client }: ResendMagicLinkModalProps) => {
  const [selectedType, setSelectedType] = useState<'WORKOUT_SHEET' | 'ANAMNESIS'>('WORKOUT_SHEET')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ status: string; message: string; channel: string; link: string } | null>(null)
  const [copied, setCopied] = useState(false)

  // Reset modal state whenever it is opened
  useEffect(() => {
    if (isOpen) {
      setResult(null)
      setCopied(false)
      setIsLoading(false)
    }
  }, [isOpen])

  const handleClose = useCallback(() => {
    setResult(null)
    setCopied(false)
    setIsLoading(false)
    onClose()
  }, [onClose])

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleClose])

  if (!isOpen) return null

  const handleSend = async () => {
    setIsLoading(true)
    try {
      const res = await api.resendStudentLink(client.id, selectedType)
      setResult(res)
    } catch (err: any) {
      console.error('Error resending link:', err)
      alert(err.message || 'Erro ao reenviar link')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyLink = () => {
    if (result?.link) {
      const fullUrl = `${window.location.origin}${result.link}`
      navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleSendAnother = () => {
    setResult(null)
    setCopied(false)
    setIsLoading(false)
    // Toggle type to streamline sending both workout sheet and anamnesis
    setSelectedType((prev) => (prev === 'WORKOUT_SHEET' ? 'ANAMNESIS' : 'WORKOUT_SHEET'))
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose()
        }
      }}
    >
      <Card className="w-full max-w-md overflow-hidden bg-white shadow-2xl">
        <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
          <h2 className="flex items-center text-lg font-bold text-slate-900">
            <MessageCircle className="mr-2 h-5 w-5 text-emerald-600" />
            Enviar Link Mágico para Aluno
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Destinatário: <strong className="text-slate-800">{client.name}</strong> ({client.phone})
          </p>
        </div>

        <div className="p-6 space-y-4">
          {!result ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Selecione o tipo de link:</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedType('WORKOUT_SHEET')}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      selectedType === 'WORKOUT_SHEET' ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-600/20' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block font-bold text-sm">Ficha de Treino</span>
                    <span className="block text-xs text-slate-500 mt-1">Acesso ao player PWA de treinos</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedType('ANAMNESIS')}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      selectedType === 'ANAMNESIS' ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-600/20' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block font-bold text-sm">Anamnese de Saúde</span>
                    <span className="block text-xs text-slate-500 mt-1">Questionário e envio de fotos</span>
                  </button>
                </div>
              </div>

              <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-800 border border-blue-200 flex items-start">
                <AlertCircle className="mr-2 h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>
                  O disparo respeita a <strong>Janela de Silêncio (22h às 08h)</strong>. Se enviado durante a noite, a mensagem será agendada para as 08h da manhã.
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                  Cancelar
                </Button>
                <Button onClick={handleSend} disabled={isLoading} className="bg-emerald-600 text-white hover:bg-emerald-700">
                  <Send className="mr-1.5 h-4 w-4" />
                  {isLoading ? 'Enfileirando...' : 'Enviar Agora'}
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-sm">Enviado com sucesso!</h4>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Tipo: <strong>{selectedType === 'WORKOUT_SHEET' ? 'Ficha de Treino' : 'Anamnese de Saúde'}</strong>
                  </p>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Canal: <strong>{result.channel}</strong> ({result.message})
                  </p>
                </div>
              </div>

              {result.link && (
                <div>
                  <span className="block text-xs font-semibold text-slate-600 mb-1">Link Direto:</span>
                  <div className="flex items-center gap-2">
                    <input readOnly value={`${window.location.origin}${result.link}`} className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded font-mono select-all" />
                    <Button size="sm" variant="outline" onClick={handleCopyLink}>
                      {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <Button variant="outline" size="sm" onClick={handleSendAnother} className="text-slate-700">
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
                  Enviar outro link
                </Button>
                <Button onClick={handleClose} className="bg-slate-800 text-white hover:bg-slate-900">
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
