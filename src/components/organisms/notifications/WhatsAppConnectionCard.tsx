import React, { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { QrCode, RefreshCw, CheckCircle2, Smartphone, Loader2, AlertCircle, LogOut, Send, X, Radio } from 'lucide-react'
import { Button, Card, Input } from '../../atoms'
import { useAccountStore } from '../../../states/stores/account/accountStore'

export const WhatsAppConnectionCard: React.FC = () => {
  const { t } = useTranslation('notifications')
  const { account, fetchAccount, connectWhatsapp, checkWhatsappStatus, disconnectWhatsapp, sendTestWhatsappMessage, qrCode, whatsappStatus, isLoading } = useAccountStore()

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Test Message Modal State
  const [isTestModalOpen, setIsTestModalOpen] = useState(false)
  const [testPhone, setTestPhone] = useState('')
  const [testMessage, setTestMessage] = useState(t('connection.messageDefault'))
  const [isSendingTest, setIsSendingTest] = useState(false)
  const [testFeedback, setTestFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const pollingTimerRef = useRef<any>(null)
  const isConnected = whatsappStatus === 'CONNECTED'

  useEffect(() => {
    fetchAccount()
    checkWhatsappStatus()
  }, [])

  const loadQrCode = async () => {
    try {
      setIsRefreshing(true)
      setErrorMessage(null)
      setSuccessMessage(null)
      await connectWhatsapp()
    } catch (err: any) {
      setErrorMessage(err.message || 'Error loading WhatsApp QR code')
    } finally {
      setIsRefreshing(false)
    }
  }

  // Auto-polling for connection status if not connected
  useEffect(() => {
    if (isConnected) {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current)
      return
    }

    pollingTimerRef.current = setInterval(async () => {
      const status = await checkWhatsappStatus()
      if (status === 'CONNECTED') {
        if (pollingTimerRef.current) clearInterval(pollingTimerRef.current)
      }
    }, 5000)

    return () => {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current)
    }
  }, [isConnected, checkWhatsappStatus])

  const handleDisconnect = async () => {
    if (!window.confirm(t('connection.disconnectConfirm'))) return

    try {
      setIsDisconnecting(true)
      setErrorMessage(null)
      setSuccessMessage(null)
      await disconnectWhatsapp()
      setSuccessMessage('Instância desconectada com sucesso.')
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao desconectar instância.')
    } finally {
      setIsDisconnecting(false)
    }
  }

  const handleSendTestMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!testPhone.trim()) {
      setTestFeedback({ type: 'error', text: 'Informe um número de telefone válido.' })
      return
    }

    try {
      setIsSendingTest(true)
      setTestFeedback(null)
      const res = await sendTestWhatsappMessage({
        phone: testPhone.trim(),
        message: testMessage.trim() || t('connection.messageDefault'),
      })
      setTestFeedback({
        type: 'success',
        text: `${t('connection.testSuccess')} ${res.messageId}`,
      })
    } catch (err: any) {
      setTestFeedback({
        type: 'error',
        text: `${t('connection.testError')} ${err.message || 'Falha no disparo'}`,
      })
    } finally {
      setIsSendingTest(false)
    }
  }

  const getStatusBadge = () => {
    switch (whatsappStatus) {
      case 'CONNECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            {t('connection.statusConnected')}
          </span>
        )
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
            {t('connection.statusPending')}
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <span className="h-2 w-2 rounded-full bg-slate-400" />
            {t('connection.statusDisconnected')}
          </span>
        )
    }
  }

  return (
    <div className="space-y-6" data-testid="whatsapp-connection-card">
      <Card className="p-6 border border-slate-200 bg-white rounded-2xl shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900">{t('connection.title')}</h2>
              {getStatusBadge()}
            </div>
            <p className="mt-1 text-sm text-slate-600">{t('connection.description')}</p>
          </div>

          <div className="flex items-center gap-2">
            {isConnected && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTestFeedback(null)
                    setIsTestModalOpen(true)
                  }}
                  className="text-slate-700 border-slate-300 hover:bg-slate-50"
                  data-testid="open-test-message-modal-btn"
                >
                  <Send className="h-4 w-4 mr-1.5 text-emerald-600" />
                  {t('connection.testMessageButton')}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnect}
                  disabled={isDisconnecting}
                  className="text-red-700 border-red-200 hover:bg-red-50"
                  data-testid="disconnect-whatsapp-btn"
                >
                  {isDisconnecting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <LogOut className="h-4 w-4 mr-1.5" />}
                  {t('connection.disconnectButton')}
                </Button>
              </>
            )}
          </div>
        </div>

        {errorMessage && (
          <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left Column: Instructions & Instance Info */}
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">{t('connection.instanceName')}</span>
              <span className="text-base font-semibold text-slate-900 mt-1 block">{account?.whatsappInstanceName || 'Instância padrão'}</span>
            </div>

            <div className="p-5 bg-slate-50/70 border border-slate-200 rounded-xl space-y-3">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-emerald-600" />
                {t('connection.instructionsTitle')}
              </h3>
              <ol className="space-y-2 text-xs sm:text-sm text-slate-600 list-decimal list-inside">
                <li>{t('connection.step1')}</li>
                <li>{t('connection.step2')}</li>
                <li>{t('connection.step3')}</li>
              </ol>
            </div>
          </div>

          {/* Right Column: QR Code or Active State */}
          <div className="flex flex-col items-center justify-center p-6 bg-slate-50/50 border border-slate-200 rounded-2xl">
            {isConnected ? (
              <div className="py-8 space-y-4 flex flex-col items-center text-center" data-testid="whatsapp-connected-panel">
                <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-inner">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900">{t('connection.statusConnected')}</h4>
                  <p className="text-sm text-slate-600 mt-1 max-w-xs">{t('connection.connectedMessage')}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 w-full flex flex-col items-center text-center">
                <div
                  className="relative h-60 w-60 border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center bg-white overflow-hidden shadow-inner p-2"
                  data-testid="notifications-qr-container"
                >
                  {isLoading || isRefreshing ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                      <span className="text-xs text-slate-500">{t('connection.statusConnecting')}</span>
                    </div>
                  ) : qrCode ? (
                    <img src={qrCode} alt="WhatsApp QR Code" className="h-full w-full object-contain" data-testid="notifications-qr-image" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <QrCode className="h-12 w-12" />
                      <span className="text-xs">Clique abaixo para gerar o QR Code</span>
                    </div>
                  )}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={loadQrCode}
                  disabled={isRefreshing || isLoading}
                  className="text-slate-700 bg-white"
                  data-testid="notifications-refresh-qr-btn"
                >
                  <RefreshCw className={`h-4 w-4 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {t('connection.refreshQr')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Test Message Modal */}
      {isTestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs" data-testid="test-message-modal">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Radio className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{t('connection.testModalTitle')}</h3>
                  <p className="text-xs text-slate-500">{t('connection.testModalSubtitle')}</p>
                </div>
              </div>
              <button type="button" onClick={() => setIsTestModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSendTestMessage} className="p-5 space-y-4">
              {testFeedback && (
                <div
                  className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                    testFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {testFeedback.type === 'success' ? <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600" /> : <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-600" />}
                  <span>{testFeedback.text}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t('connection.phoneLabel')}</label>
                <Input type="text" placeholder={t('connection.phonePlaceholder')} value={testPhone} onChange={(e) => setTestPhone(e.target.value)} required data-testid="test-phone-input" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t('connection.messageLabel')}</label>
                <textarea
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  rows={3}
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  required
                  data-testid="test-message-input"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsTestModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" size="sm" disabled={isSendingTest} className="bg-emerald-600 hover:bg-emerald-700 text-white" data-testid="submit-test-message-btn">
                  {isSendingTest ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                      {t('connection.sending')}
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-1.5" />
                      {t('connection.sendTest')}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
