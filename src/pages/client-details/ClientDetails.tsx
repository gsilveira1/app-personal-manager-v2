import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router'
import { ArrowLeft, Save, Edit2, FileText, DollarSign, MessageCircle, PauseCircle, PlayCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useStore } from '../../states/stores/store'
import { Card, Button } from '../../components/atoms'
import { useClientDetails } from '../../hooks/useClientDetails'
import { ClientProfileHeader } from '../../components/organisms/client-details/ClientProfileHeader'
import { MedicalHistoryCard } from '../../components/organisms/client-details/MedicalHistoryCard'
import { WorkoutEditorModal } from '../../components/WorkoutEditorModal'
import { ClientSessionHistoryTab } from '../../components/organisms/client-details/ClientSessionHistoryTab'
import { ClientEvaluationsTab } from '../../components/organisms/client-details/ClientEvaluationsTab'
import { ClientWorkoutsTab } from '../../components/organisms/client-details/ClientWorkoutsTab'
import { ManualPaymentModal } from '../../components/organisms/client-details/ManualPaymentModal'
import { AnamnesisTab } from '../../components/organisms/client-details/AnamnesisTab'
import { WorkoutSheetsTab } from '../../components/organisms/client-details/WorkoutSheetsTab'
import { ConsistencyHeatmap } from '../../components/organisms/client-details/ConsistencyHeatmap'
import { ResendMagicLinkModal } from '../../components/organisms/client-details/ResendMagicLinkModal'
import * as api from '../../services/api/apiService'
import type { WorkoutPlan, MedicalHistory } from '../../types'

export const ClientDetails = () => {
  const { t } = useTranslation('clients')
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { clients, sessions, evaluations, workouts, plans, updateClient, uploadClientAvatar, addWorkout, updateWorkout, deleteWorkout } = useStore()

  const [activeTab, setActiveTab] = useState<'history' | 'sheets' | 'anamnesis' | 'evaluations'>('history')
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false)
  const [editingWorkout, setEditingWorkout] = useState<WorkoutPlan | null>(null)
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [isEditingMedicalHistory, setIsEditingMedicalHistory] = useState(false)
  const [notesBuffer, setNotesBuffer] = useState('')
  const [medicalHistoryBuffer, setMedicalHistoryBuffer] = useState<MedicalHistory>({ objective: [''], injuries: '', surgeries: '', medications: '' })
  const [selectedMetric, setSelectedMetric] = useState<string>('weight')
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  // Modals for Features 002, 007
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isResendModalOpen, setIsResendModalOpen] = useState(false)

  const client = clients.find((c) => c.id === id)
  const clientPlan = plans.find((p) => p.id === client?.planId)
  const { clientSessions, clientEvaluations, activePlans, archivedPlans, chartData, chartableMetrics } = useClientDetails(id, sessions, evaluations, workouts, selectedMetric)

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <h2 className="text-xl font-semibold text-slate-900">{t('notFound')}</h2>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/clients')}>
          {t('backToClients')}
        </Button>
      </div>
    )
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB.')
      return
    }
    if (!file.type.match(/^image\/(jpeg|png|webp|gif)$/)) {
      alert('Formato inválido. Use JPEG, PNG, WebP ou GIF.')
      return
    }
    setIsUploadingAvatar(true)
    try {
      await uploadClientAvatar(client.id, file)
    } catch (error) {
      console.error('Avatar upload failed:', error)
      alert('Erro ao enviar a foto. Tente novamente.')
    } finally {
      setIsUploadingAvatar(false)
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    }
  }

  const handleSaveWorkout = (workout: any) => {
    if (editingWorkout) updateWorkout(editingWorkout.id, workout)
    else addWorkout(workout)
    setIsWorkoutModalOpen(false)
  }

  const handleSaveManualPayment = async (paymentData: { paymentType: string; validUntil: string; notes?: string; amount?: number }) => {
    await api.recordManualPayment(client.id, paymentData)
    await updateClient(client.id, {
      subscriptionStatus: 'ACTIVE',
      currentPeriodEnd: paymentData.validUntil,
    })
  }

  const handleToggleStatus = async () => {
    const newStatus = client.subscriptionStatus === 'PAUSED' ? 'ACTIVE' : 'PAUSED'
    await api.updateStudentStatus(client.id, newStatus)
    await updateClient(client.id, {
      subscriptionStatus: newStatus as any,
    })
  }

  const tabItems = [
    { key: 'history', label: t('historyAndConsistency') },
    { key: 'sheets', label: t('sheetsAndPrescriptions') },
    { key: 'anamnesis', label: t('anamnesisAndHealth') },
    { key: 'evaluations', label: t('evaluations') },
  ] as const

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" onClick={() => navigate('/clients')} className="pl-0 text-slate-500 hover:text-slate-900">
          <ArrowLeft className="mr-2 h-4 w-4" /> {t('backToClients')}
        </Button>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsResendModalOpen(true)}>
            <MessageCircle className="mr-1.5 h-4 w-4 text-emerald-600" />
            Enviar Link WhatsApp
          </Button>

          <Button variant="outline" size="sm" onClick={() => setIsPaymentModalOpen(true)}>
            <DollarSign className="mr-1.5 h-4 w-4 text-emerald-600" />
            Pagamento Manual
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleStatus}
            className={client.subscriptionStatus === 'PAUSED' ? 'text-emerald-700 hover:bg-emerald-50' : 'text-amber-700 hover:bg-amber-50'}
          >
            {client.subscriptionStatus === 'PAUSED' ? (
              <>
                <PlayCircle className="mr-1.5 h-4 w-4" /> Ativar Aluno
              </>
            ) : (
              <>
                <PauseCircle className="mr-1.5 h-4 w-4" /> Pausar Aluno
              </>
            )}
          </Button>
        </div>
      </div>

      <ClientProfileHeader client={client} clientPlan={clientPlan} isUploadingAvatar={isUploadingAvatar} avatarInputRef={avatarInputRef} onAvatarChange={handleAvatarChange} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <MedicalHistoryCard
            client={client}
            isEditing={isEditingMedicalHistory}
            buffer={medicalHistoryBuffer}
            onStartEdit={() => {
              setMedicalHistoryBuffer(client.medicalHistory || {})
              setIsEditingMedicalHistory(true)
            }}
            onSave={() => {
              updateClient(client.id, { medicalHistory: medicalHistoryBuffer })
              setIsEditingMedicalHistory(false)
            }}
            onBufferChange={setMedicalHistoryBuffer}
          />
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-indigo-600" />
                {t('notesAndLimitations')}
              </h3>
              {!isEditingNotes ? (
                <button
                  onClick={() => {
                    setNotesBuffer(client.notes || '')
                    setIsEditingNotes(true)
                  }}
                  className="text-slate-400 hover:text-indigo-600"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    updateClient(client.id, { notes: notesBuffer })
                    setIsEditingNotes(false)
                  }}
                  className="text-green-600 hover:text-green-700"
                >
                  <Save className="h-4 w-4" />
                </button>
              )}
            </div>
            {isEditingNotes ? (
              <textarea
                className="w-full h-32 p-3 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                value={notesBuffer}
                onChange={(e) => setNotesBuffer(e.target.value)}
              />
            ) : (
              <div className="bg-yellow-50 text-yellow-900 p-4 rounded-lg text-sm leading-relaxed whitespace-pre-wrap">{client.notes || t('noNotes')}</div>
            )}
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="flex border-b border-slate-200 space-x-6 overflow-x-auto pb-1">
            {tabItems.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`pb-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === tab.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'history' && (
            <div className="space-y-6">
              <ConsistencyHeatmap clientId={client.id} />
              <ClientSessionHistoryTab clientSessions={clientSessions} />
            </div>
          )}

          {activeTab === 'sheets' && (
            <div className="space-y-6">
              <WorkoutSheetsTab client={client} />
              <ClientWorkoutsTab
                activePlans={activePlans}
                archivedPlans={archivedPlans}
                onEditWorkout={(w) => {
                  setEditingWorkout(w)
                  setIsWorkoutModalOpen(true)
                }}
                onDeleteWorkout={deleteWorkout}
                onUpdateWorkoutStatus={(id, status) => updateWorkout(id, { status })}
              />
            </div>
          )}

          {activeTab === 'anamnesis' && <AnamnesisTab client={client} />}

          {activeTab === 'evaluations' && (
            <ClientEvaluationsTab
              clientEvaluations={clientEvaluations}
              chartData={chartData}
              selectedMetric={selectedMetric}
              setSelectedMetric={setSelectedMetric}
              chartableMetrics={chartableMetrics}
            />
          )}
        </div>
      </div>

      {isWorkoutModalOpen && <WorkoutEditorModal client={client} initialData={editingWorkout} isOpen={isWorkoutModalOpen} onClose={() => setIsWorkoutModalOpen(false)} onSave={handleSaveWorkout} />}

      <ManualPaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} client={client} onSave={handleSaveManualPayment} />

      <ResendMagicLinkModal isOpen={isResendModalOpen} onClose={() => setIsResendModalOpen(false)} client={client} />
    </div>
  )
}

// Re-export for backward compatibility
export { ConfirmationModal } from '../../components/organisms/client-details/ConfirmationModal'
