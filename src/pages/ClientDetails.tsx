import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router'
import { ArrowLeft, Plus, FileText, Activity, History, Dumbbell, Edit2, Save, CheckCircle2, XCircle } from 'lucide-react'
import { parseISO } from 'date-fns'
import { useTranslation } from 'react-i18next'

import { formatLocalized } from '../utils/dateLocale'
import { useStore } from '../store/store'
import { Card, Button } from '../components/atoms'
import { useClientDetails } from '../hooks/useClientDetails'
import { ClientProfileHeader } from '../components/organisms/client-details/ClientProfileHeader'
import { MedicalHistoryCard } from '../components/organisms/client-details/MedicalHistoryCard'
import { EvaluationCard } from '../components/organisms/client-details/EvaluationCard'
import { WorkoutCard } from '../components/organisms/client-details/WorkoutCard'
import { EvaluationModal } from '../components/organisms/client-details/EvaluationModal'
import { SessionLogModal } from '../components/organisms/client-details/SessionLogModal'
import { ProgressChart } from '../components/organisms/client-details/ProgressChart'
import { WorkoutEditorModal } from '../components/WorkoutEditorModal'
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
            <div className="space-y-4">
              <div className="flex justify-between items-center"><h3 className="text-lg font-semibold text-slate-900">{t('sessionHistory')}</h3><Button onClick={() => setIsSessionModalOpen(true)}><Plus className="mr-2 h-4 w-4" /> {t('newSession')}</Button></div>
              {clientSessions.length > 0 ? clientSessions.map((session) => (
                <Card key={session.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 p-2 rounded-full ${session.completed ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>{session.completed ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}</div>
                    <div>
                      <div className="font-semibold text-slate-900">{formatLocalized(parseISO(session.date), 'EEEE, MMMM d, yyyy')}</div>
                      <div className="text-sm text-slate-500 mt-0.5">{formatLocalized(parseISO(session.date), 'h:mm a')} • {session.durationMinutes} min • {session.type}</div>
                      {session.notes && <div className="mt-2 text-sm bg-slate-50 p-2 rounded text-slate-600">"{session.notes}"</div>}
                    </div>
                  </div>
                </Card>
              )) : (
                <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-200"><History className="h-12 w-12 text-slate-300 mx-auto mb-3" /><h3 className="text-lg font-medium text-slate-900">{t('noSessions')}</h3><Button className="mt-3" onClick={() => setIsSessionModalOpen(true)}>{t('logFirstSession')}</Button></div>
              )}
            </div>
          )}

          {activeTab === 'evaluations' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center"><h3 className="text-lg font-semibold text-slate-900">{t('progressTracking')}</h3><Button onClick={() => setIsEvalModalOpen(true)}><Plus className="mr-2 h-4 w-4" /> {t('addEvaluation')}</Button></div>
              {clientEvaluations.length > 0 ? (<>{clientEvaluations.length > 1 && <ProgressChart chartData={chartData} selectedMetric={selectedMetric} onMetricChange={setSelectedMetric} chartableMetrics={chartableMetrics} />}<div className="space-y-4">{clientEvaluations.map((ev) => <EvaluationCard key={ev.id} evaluation={ev} />)}</div></>) : (
                <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-200"><Activity className="h-12 w-12 text-slate-300 mx-auto mb-3" /><h3 className="text-lg font-medium text-slate-900">{t('noEvaluations')}</h3><Button onClick={() => setIsEvalModalOpen(true)}>{t('addFirstEvaluation')}</Button></div>
              )}
            </div>
          )}

          {activeTab === 'workouts' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center"><h3 className="text-lg font-semibold text-slate-900">{t('workoutPlans')}</h3><Button onClick={() => { setEditingWorkout(null); setIsWorkoutModalOpen(true) }}><Plus className="mr-2 h-4 w-4" /> {t('createWorkout')}</Button></div>
              <div className="space-y-4"><h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider flex items-center"><Dumbbell className="h-4 w-4 mr-2" /> {t('activePrescriptions')}</h4>{activePlans.length > 0 ? activePlans.map((w) => <WorkoutCard key={w.id} workout={w} onDelete={(id) => { if (window.confirm(tw('deleteWorkoutConfirm'))) deleteWorkout(id) }} onArchive={(id) => updateWorkout(id, { status: 'Archived' })} onEdit={(w) => { setEditingWorkout(w); setIsWorkoutModalOpen(true) }} isActive />) : <div className="p-8 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-center text-slate-500">{t('noActivePrescriptions')}</div>}</div>
              <div className="space-y-4 pt-4 border-t border-slate-200"><h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider flex items-center"><History className="h-4 w-4 mr-2" /> {t('planHistory')}</h4>{archivedPlans.length > 0 ? archivedPlans.map((w) => <WorkoutCard key={w.id} workout={w} onDelete={(id) => { if (window.confirm(tw('deleteWorkoutConfirm'))) deleteWorkout(id) }} onActivate={(id) => updateWorkout(id, { status: 'Active' })} onEdit={(w) => { setEditingWorkout(w); setIsWorkoutModalOpen(true) }} isActive={false} />) : <div className="p-4 text-center text-sm text-slate-400 italic">{t('noArchivedPlans')}</div>}</div>
            </div>
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
