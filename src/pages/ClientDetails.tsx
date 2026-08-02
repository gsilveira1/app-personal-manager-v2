import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router'
import { ArrowLeft, Edit2, Save, FileText } from 'lucide-react'
import { parseISO } from 'date-fns'
import { useTranslation } from 'react-i18next'

import { formatLocalized } from '../utils/dateLocale'
import { useStore } from '../states/stores/store'
import { Card, Button } from '../components/atoms'
import { useClientDetails } from '../hooks/useClientDetails'
import { ClientProfileHeader } from '../components/organisms/client-details/ClientProfileHeader'
import { MedicalHistoryCard } from '../components/organisms/client-details/MedicalHistoryCard'
import { EvaluationCard } from '../components/organisms/client-details/EvaluationCard'
import { EvaluationModal } from '../components/organisms/client-details/EvaluationModal'
import { SessionLogModal } from '../components/organisms/client-details/SessionLogModal'
import { WorkoutEditorModal } from '../components/WorkoutEditorModal'
import { ClientSessionHistoryTab } from '../components/organisms/client-details/ClientSessionHistoryTab'
import { ClientEvaluationsTab } from '../components/organisms/client-details/ClientEvaluationsTab'
import { ClientWorkoutsTab } from '../components/organisms/client-details/ClientWorkoutsTab'
import type { WorkoutPlan, MedicalHistory } from '../types'

export const ClientDetails = () => {
  const { t } = useTranslation('clients')
  const { t: tw } = useTranslation('workouts')
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { clients, sessions, evaluations, workouts, plans, updateClient, uploadClientAvatar, addEvaluation, addSession, addWorkout, updateWorkout, deleteWorkout } = useStore()

  const [activeTab, setActiveTab] = useState<'history' | 'evaluations' | 'workouts'>('history')
  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false)
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false)
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false)
  const [editingWorkout, setEditingWorkout] = useState<WorkoutPlan | null>(null)
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [isEditingMedicalHistory, setIsEditingMedicalHistory] = useState(false)
  const [notesBuffer, setNotesBuffer] = useState('')
  const [medicalHistoryBuffer, setMedicalHistoryBuffer] = useState<MedicalHistory>({ objective: [''], injuries: '', surgeries: '', medications: '' })
  const [selectedMetric, setSelectedMetric] = useState<string>('weight')
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const client = clients.find((c) => c.id === id)
  const clientPlan = plans.find((p) => p.id === client?.planId)
  const { clientSessions, clientEvaluations, activePlans, archivedPlans, chartData, chartableMetrics } = useClientDetails(id, sessions, evaluations, workouts, selectedMetric)

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <h2 className="text-xl font-semibold text-slate-900">{t('notFound')}</h2>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/clients')}>{t('backToClients')}</Button>
      </div>
    )
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { alert('A imagem deve ter no máximo 5MB.'); return }
    if (!file.type.match(/^image\/(jpeg|png|webp|gif)$/)) { alert('Formato inválido. Use JPEG, PNG, WebP ou GIF.'); return }
    setIsUploadingAvatar(true)
    try { await uploadClientAvatar(client.id, file) } catch (error) { console.error('Avatar upload failed:', error); alert('Erro ao enviar a foto. Tente novamente.') } finally { setIsUploadingAvatar(false); if (avatarInputRef.current) avatarInputRef.current.value = '' }
  }

  const handleSaveWorkout = (workout: any) => { if (editingWorkout) updateWorkout(editingWorkout.id, workout); else addWorkout(workout); setIsWorkoutModalOpen(false) }

  const tabItems = [
    { key: 'history', label: t('sessionHistory') },
    { key: 'evaluations', label: t('evaluations') },
    { key: 'workouts', label: t('prescriptions') },
  ] as const

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate('/clients')} className="pl-0 text-slate-500 hover:text-slate-900"><ArrowLeft className="mr-2 h-4 w-4" /> {t('backToClients')}</Button>

      <ClientProfileHeader client={client} clientPlan={clientPlan} isUploadingAvatar={isUploadingAvatar} avatarInputRef={avatarInputRef} onAvatarChange={handleAvatarChange} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <MedicalHistoryCard client={client} isEditing={isEditingMedicalHistory} buffer={medicalHistoryBuffer} onStartEdit={() => { setMedicalHistoryBuffer(client.medicalHistory || {}); setIsEditingMedicalHistory(true) }} onSave={() => { updateClient(client.id, { medicalHistory: medicalHistoryBuffer }); setIsEditingMedicalHistory(false) }} onBufferChange={setMedicalHistoryBuffer} />
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900 flex items-center"><FileText className="h-5 w-5 mr-2 text-indigo-600" />{t('notesAndLimitations')}</h3>
              {!isEditingNotes ? <button onClick={() => { setNotesBuffer(client.notes || ''); setIsEditingNotes(true) }} className="text-slate-400 hover:text-indigo-600"><Edit2 className="h-4 w-4" /></button> : <button onClick={() => { updateClient(client.id, { notes: notesBuffer }); setIsEditingNotes(false) }} className="text-green-600 hover:text-green-700"><Save className="h-4 w-4" /></button>}
            </div>
            {isEditingNotes ? <textarea className="w-full h-32 p-3 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none" value={notesBuffer} onChange={(e) => setNotesBuffer(e.target.value)} /> : <div className="bg-yellow-50 text-yellow-900 p-4 rounded-lg text-sm leading-relaxed whitespace-pre-wrap">{client.notes || t('noNotes')}</div>}
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="flex border-b border-slate-200 space-x-6">
            {tabItems.map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === tab.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>{tab.label}</button>
            ))}
          </div>

          {activeTab === 'history' && (
            <ClientSessionHistoryTab
              clientSessions={clientSessions}
              onOpenSessionModal={() => setIsSessionModalOpen(true)}
            />
          )}

          {activeTab === 'evaluations' && (
            <ClientEvaluationsTab
              clientEvaluations={clientEvaluations}
              chartData={chartData}
              selectedMetric={selectedMetric}
              setSelectedMetric={setSelectedMetric}
              chartableMetrics={chartableMetrics}
              onOpenEvalModal={() => setIsEvalModalOpen(true)}
            />
          )}

          {activeTab === 'workouts' && (
            <ClientWorkoutsTab
              activePlans={activePlans}
              archivedPlans={archivedPlans}
              onOpenWorkoutModal={() => { setEditingWorkout(null); setIsWorkoutModalOpen(true) }}
              onEditWorkout={(w) => { setEditingWorkout(w); setIsWorkoutModalOpen(true) }}
              onDeleteWorkout={deleteWorkout}
              onUpdateWorkoutStatus={(id, status) => updateWorkout(id, { status })}
            />
          )}
        </div>
      </div>

      {isEvalModalOpen && <EvaluationModal clientId={client.id} onClose={() => setIsEvalModalOpen(false)} onSave={addEvaluation} />}
      {isSessionModalOpen && <SessionLogModal clientId={client.id} onClose={() => setIsSessionModalOpen(false)} onSave={addSession} />}
      {isWorkoutModalOpen && <WorkoutEditorModal client={client} initialData={editingWorkout} isOpen={isWorkoutModalOpen} onClose={() => setIsWorkoutModalOpen(false)} onSave={handleSaveWorkout} />}
    </div>
  )
}

// Re-export for backward compatibility
export { ConfirmationModal } from '../components/organisms/client-details/ConfirmationModal'
