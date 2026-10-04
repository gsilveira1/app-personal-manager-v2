import React, { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { QrCode, RefreshCw, CheckCircle2, Smartphone, Loader2, AlertCircle } from 'lucide-react'
import { Button, Card } from '../../../components/ui'
import { useAccountStore } from '../../../states/stores/account/accountStore'

interface WhatsAppStepProps {
  onComplete: () => void
}

export const WhatsAppStep: React.FC<WhatsAppStepProps> = ({ onComplete }) => {
  const { t } = useTranslation('setupWizard')
  const { connectWhatsapp, checkWhatsappStatus, completeSetup, qrCode, whatsappStatus, isLoading } = useAccountStore()

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isFinishing, setIsFinishing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const pollingTimerRef = useRef<any>(null)

  const isConnected = whatsappStatus === 'CONNECTED'

  const loadQrCode = async () => {
    try {
      setIsRefreshing(true)
      setErrorMessage(null)
      await connectWhatsapp()
    } catch (err: any) {
      setErrorMessage(err.message || 'Error loading WhatsApp QR code')
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    if (!isConnected) {
      loadQrCode()
    }
  }, [])

  // Auto-polling for connection status
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
    }, 4000)

    return () => {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current)
    }
  }, [isConnected, checkWhatsappStatus])

  const handleFinishSetup = async () => {
    try {
      setIsFinishing(true)
      setErrorMessage(null)
      await completeSetup()
      onComplete()
    } catch (err: any) {
      setErrorMessage(err.message || 'Error completing setup')
    } finally {
      setIsFinishing(false)
    }
  }

  return (
    <div className="space-y-8" data-testid="whatsapp-step">
      <div>
        <span className="inline-block px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-100 rounded-full mb-2">{t('step2.badge')}</span>
        <h2 className="text-2xl font-bold text-slate-800">{t('step2.title')}</h2>
        <p className="mt-1 text-sm text-slate-600">{t('step2.description')}</p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Left Column: Instructions */}
        <div className="space-y-6">
          <Card className="p-6 border border-slate-200 bg-slate-50/50 rounded-xl">
            <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2 mb-4">
              <Smartphone className="h-5 w-5 text-emerald-600" />
              {t('step2.instructionsTitle')}
            </h3>
            <ol className="space-y-4 text-sm text-slate-700">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">1</span>
                <span>{t('step2.instruction1')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">2</span>
                <span>{t('step2.instruction2')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">3</span>
                <span>{t('step2.instruction3')}</span>
              </li>
            </ol>
          </Card>
        </div>

        {/* Right Column: QR Code & Status */}
        <div className="flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-xl shadow-sm text-center">
          {isConnected ? (
            <div className="py-8 space-y-4 flex flex-col items-center" data-testid="whatsapp-connected-badge">
              <CheckCircle2 className="h-16 w-16 text-emerald-500 animate-bounce" />
              <div>
                <h4 className="text-lg font-bold text-slate-900">{t('step2.connectedTitle')}</h4>
                <p className="text-sm text-slate-600 mt-1 max-w-xs">{t('step2.connectedSubtitle')}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 w-full flex flex-col items-center">
              <div className="relative h-64 w-64 border-2 border-slate-200 rounded-2xl flex items-center justify-center bg-slate-50 overflow-hidden shadow-inner" data-testid="qr-container">
                {isLoading || isRefreshing ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                    <span className="text-xs text-slate-500">{t('step2.connecting')}</span>
                  </div>
                ) : qrCode ? (
                  <img src={qrCode} alt="WhatsApp QR Code" className="h-full w-full object-contain p-2" data-testid="whatsapp-qr-image" />
                ) : (
                  <QrCode className="h-16 w-16 text-slate-400" />
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span>{t('step2.connecting')}</span>
              </div>

              <Button type="button" variant="outline" size="sm" onClick={loadQrCode} disabled={isRefreshing || isLoading} className="mt-2 text-slate-700" data-testid="refresh-qr-button">
                <RefreshCw className={`h-4 w-4 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                {t('step2.refreshQrButton')}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Footer Finish CTA */}
      <div className="pt-6 border-t border-slate-200 flex justify-end">
        <Button
          onClick={handleFinishSetup}
          disabled={isFinishing || isLoading}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 text-base shadow-lg shadow-emerald-600/20"
          data-testid="finish-setup-button"
        >
          {isFinishing ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <CheckCircle2 className="h-5 w-5 mr-2" />}
          {t('step2.finishButton')}
        </Button>
      </div>
    </div>
  )
}
