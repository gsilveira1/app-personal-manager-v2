import { useState, useEffect } from 'react'
import { Activity, Send, Calendar, CheckCircle2, Image as ImageIcon, Printer, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, Button } from '../../atoms'
import * as api from '../../../services/api/apiService'
import type { Client, AnamnesisRecord } from '../../../types'

interface AnamnesisTabProps {
  client: Client
}

/** Label of one entry of the anamnesis history: the current one, a submitted one, or a request still open/expired. */
const anamnesisLabel = (record: AnamnesisRecord, position: number, t: (key: string, options?: Record<string, unknown>) => string): string => {
  const day = new Date(record.date || record.createdAt).toLocaleDateString()
  if (record.status === 'PENDING') return t('anamnesis.pendingLabel', { date: day })
  if (record.status === 'EXPIRED') return t('anamnesis.expiredLabel', { date: day })
  return record.isCurrent ? `Vigente (${day})` : `Avaliação #${position} (${day})`
}

export const AnamnesisTab = ({ client }: AnamnesisTabProps) => {
  const { t } = useTranslation('clients')
  const [anamneses, setAnamneses] = useState<AnamnesisRecord[]>([])
  const [selectedAnamnesis, setSelectedAnamnesis] = useState<AnamnesisRecord | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRequesting, setIsRequesting] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const loadAnamneses = async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const data = await api.getStudentAnamneses(client.id)
      setAnamneses(data || [])
      if (data && data.length > 0) {
        setSelectedAnamnesis(data.find((a) => a.isCurrent) || data.find((a) => a.status === 'SUBMITTED') || data[0])
      }
    } catch (err) {
      console.error('Error loading anamnesis history:', { clientId: client.id, err })
      setLoadError(err instanceof Error && err.message ? err.message : t('anamnesis.loadError'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAnamneses()
  }, [client.id])

  const handleRequestReassessment = async () => {
    setIsRequesting(true)
    setFeedbackMessage(null)
    try {
      const res = await api.requestReassessment(client.id)
      setFeedbackMessage(res.message || 'Solicitação de reavaliação enviada via WhatsApp!')
      await loadAnamneses()
    } catch (err: any) {
      console.error('Error requesting reassessment:', err)
      setFeedbackMessage(err.message || 'Erro ao solicitar reavaliação.')
    } finally {
      setIsRequesting(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-slate-500">Carregando ficha de anamnese...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center">
            <Activity className="mr-2 h-5 w-5 text-emerald-600" />
            {t('anamnesis.title', 'Anamnese e Histórico de Saúde')}
          </h3>
          <p className="text-xs text-slate-500">{t('anamnesis.subtitle', 'Acompanhe respostas do formulário e evolução estética')}</p>
        </div>

        <div className="flex items-center gap-2">
          {selectedAnamnesis && (
            <Button variant="outline" size="sm" onClick={handlePrint} className="no-print">
              <Printer className="mr-1.5 h-4 w-4" />
              {t('anamnesis.print', 'Imprimir (Ctrl+P)')}
            </Button>
          )}
          <Button size="sm" onClick={handleRequestReassessment} disabled={isRequesting} className="bg-emerald-600 text-white hover:bg-emerald-700 no-print">
            <Send className="mr-1.5 h-4 w-4" />
            {isRequesting ? 'Enviando...' : t('anamnesis.requestReassessment', 'Solicitar Reavaliação')}
          </Button>
        </div>
      </div>

      {feedbackMessage && (
        <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 border border-emerald-200 flex items-center">
          <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600" />
          {feedbackMessage}
        </div>
      )}

      {/* History Selector if multiple assessments exist */}
      {anamneses.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 no-print">
          {anamneses.map((a, idx) => (
            <button
              key={a.id}
              onClick={() => setSelectedAnamnesis(a)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all ${
                selectedAnamnesis?.id === a.id ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Calendar className="mr-1 inline h-3.5 w-3.5" />
              {anamnesisLabel(a, anamneses.length - idx, t)}
            </button>
          ))}
        </div>
      )}

      {loadError && (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {loadError}
        </p>
      )}

      {selectedAnamnesis && selectedAnamnesis.status !== 'SUBMITTED' && (
        <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {selectedAnamnesis.status === 'EXPIRED' ? t('anamnesis.expiredNotice') : t('anamnesis.pendingNotice')}
        </p>
      )}

      {selectedAnamnesis ? (
        <div className="space-y-6 print:space-y-4">
          {/* Photos Row */}
          {(selectedAnamnesis.frontPhotoUrl || selectedAnamnesis.backPhotoUrl || selectedAnamnesis.sidePhotoUrl) && (
            <Card className="p-4">
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center">
                <ImageIcon className="mr-1.5 h-4 w-4 text-slate-600" />
                {t('anamnesis.photos', 'Fotos Corporais')}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Frente', url: selectedAnamnesis.frontPhotoUrl },
                  { label: 'Perfil', url: selectedAnamnesis.sidePhotoUrl },
                  { label: 'Costas', url: selectedAnamnesis.backPhotoUrl },
                ].map((p, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <span className="mb-1 text-xs font-semibold text-slate-600">{p.label}</span>
                    {p.url ? (
                      <div
                        onClick={() => setLightboxPhoto(p.url || null)}
                        className="group relative aspect-[3/4] w-full cursor-pointer overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow-sm transition hover:ring-2 hover:ring-emerald-500"
                      >
                        <img src={p.url} alt={p.label} className="h-full w-full object-cover transition group-hover:scale-105" />
                      </div>
                    ) : (
                      <div className="flex aspect-[3/4] w-full items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-xs text-slate-400">Sem foto</div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Histórico e Limitações</h4>
              <div>
                <span className="text-xs font-semibold text-slate-500">Doenças e Medicamentos:</span>
                <p className="mt-0.5 text-sm text-slate-800">{selectedAnamnesis.medicalHistory || 'Nenhum informado'}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-500">Dores e Lesões Articulares:</span>
                <p className="mt-0.5 text-sm text-slate-800">{selectedAnamnesis.injuriesAndPain || 'Nenhuma'}</p>
              </div>
            </Card>

            <Card className="p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Objetivo e Rotina</h4>
              <div>
                <span className="text-xs font-semibold text-slate-500">Objetivos Principais:</span>
                <p className="mt-0.5 text-sm text-slate-800">{selectedAnamnesis.fitnessGoals || 'Não especificado'}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-500">Disponibilidade de Horário:</span>
                <p className="mt-0.5 text-sm text-slate-800">{selectedAnamnesis.routineAndSchedule || 'Não especificado'}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-500">Nível de Experiência:</span>
                <p className="mt-0.5 text-sm text-slate-800">{selectedAnamnesis.experienceLevel || 'Intermediário'}</p>
              </div>
            </Card>
          </div>

          {/* PAR-Q Checklist */}
          {selectedAnamnesis.parqAnswers && (
            <Card className="p-4">
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Questionário PAR-Q</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {Object.entries(selectedAnamnesis.parqAnswers).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between p-2 rounded bg-slate-50">
                    <span className="text-slate-700 font-medium">{k.toUpperCase()}</span>
                    <span className={`px-2 py-0.5 rounded font-semibold ${v ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>{v ? 'SIM' : 'NÃO'}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      ) : (
        <Card className="p-8 text-center text-slate-500">
          <Activity className="mx-auto h-8 w-8 text-slate-400 mb-2" />
          <p className="text-sm font-medium">Nenhuma anamnese preenchida ainda.</p>
          <p className="text-xs text-slate-400 mt-1">Clique em "Solicitar Reavaliação" para enviar o link ao WhatsApp do aluno.</p>
        </Card>
      )}

      {/* Lightbox Modal */}
      {lightboxPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setLightboxPhoto(null)}>
          <button className="absolute top-4 right-4 text-white hover:text-slate-300" onClick={() => setLightboxPhoto(null)}>
            <X className="h-8 w-8" />
          </button>
          <img src={lightboxPhoto} alt="Zoom" className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl" />
        </div>
      )}
    </div>
  )
}
