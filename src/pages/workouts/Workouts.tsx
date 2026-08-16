import { useState } from 'react'
import { Sparkles, Users, Dumbbell, CalendarDays, Activity } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { useStore } from '../../states/stores/store'
import { type WorkoutPlan, type Client, ClientStatus } from '../../types'
import { TabBar } from '../../components/molecules/TabBar'
import { ClientAvatar } from '../../components/molecules/ClientAvatar'
import { WorkoutLibrary } from '../../components/organisms/workouts/WorkoutLibrary'
import { AIWorkoutGenerator } from '../../components/organisms/workouts/AIWorkoutGenerator'
import { WorkoutEditorModal } from '../../components/WorkoutEditorModal'
import { SessionLogModal } from '../../components/organisms/client-details/SessionLogModal'
import { EvaluationModal } from '../../components/organisms/client-details/EvaluationModal'
import { Card, Button } from '../../components/atoms'

export const Workouts = () => {
  const { t } = useTranslation('workouts')
  const { t: tc } = useTranslation('clients')
  const navigate = useNavigate()
  const { workouts, addWorkout, updateWorkout, deleteWorkout, clients, addSession, addEvaluation } = useStore()
  const [activeTab, setActiveTab] = useState<'clients' | 'library' | 'ai'>('clients')
  
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingWorkout, setEditingWorkout] = useState<WorkoutPlan | null>(null)
  
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false)
  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  const libraryWorkouts = workouts.filter((w) => !w.clientId)
  const activeClients = clients.filter(c => c.status === ClientStatus.Active)

  const handleCreateTemplate = () => { setEditingWorkout(null); setSelectedClient(null); setIsEditorOpen(true) }
  const handleEditTemplate = (workout: WorkoutPlan) => { setEditingWorkout(workout); setSelectedClient(null); setIsEditorOpen(true) }
  const handleDeleteTemplate = (id: string) => { if (window.confirm(t('deleteWorkoutConfirm'))) deleteWorkout(id) }

  const handleSaveWorkout = (workout: Omit<WorkoutPlan, 'id' | 'createdAt'>) => {
    if (editingWorkout) updateWorkout(editingWorkout.id, { ...editingWorkout, ...workout })
    else addWorkout(workout)
    setIsEditorOpen(false)
  }

  const handleCreateClientWorkout = (client: Client) => {
    setEditingWorkout(null)
    setSelectedClient(client)
    setIsEditorOpen(true)
  }

  const handleLogSession = (client: Client) => {
    setSelectedClient(client)
    setIsSessionModalOpen(true)
  }

  const handleAddEval = (client: Client) => {
    setSelectedClient(client)
    setIsEvalModalOpen(true)
  }

  const tabs = [
    { id: 'clients' as const, label: tc('clients', 'Clients'), icon: Users },
    { id: 'library' as const, label: t('templates') },
    { id: 'ai' as const, label: t('aiGenerator'), icon: Sparkles },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{t('title')}</h1>
        <TabBar tabs={tabs} activeTab={activeTab as any} onChange={setActiveTab as any} />
      </div>

      {activeTab === 'clients' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeClients.map(client => (
            <Card key={client.id} className="p-4 flex flex-col space-y-4 hover:shadow-md transition-shadow">
              <div 
                className="flex items-center space-x-3 cursor-pointer" 
                onClick={() => navigate(`/clients/${client.id}`)}
              >
                <ClientAvatar name={client.name} avatar={client.avatar} size="lg" />
                <div>
                  <h3 className="font-medium text-slate-900">{client.name}</h3>
                  <p className="text-sm text-slate-500">{client.goal || (client as any).objective}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2 pt-2 border-t border-slate-100">
                <Button variant="outline" className="w-full justify-start" onClick={() => handleCreateClientWorkout(client)}>
                  <Dumbbell className="w-4 h-4 mr-2" /> {tc('createWorkout', 'Create Workout')}
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => handleLogSession(client)}>
                  <CalendarDays className="w-4 h-4 mr-2" /> {tc('newSession', 'Log Session')}
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => handleAddEval(client)}>
                  <Activity className="w-4 h-4 mr-2" /> {tc('addEvaluation', 'Add Evaluation')}
                </Button>
              </div>
            </Card>
          ))}
          {activeClients.length === 0 && (
            <div className="col-span-full p-8 text-center text-slate-500 bg-white rounded-lg border border-slate-200">
              {tc('noActiveClients', 'No active clients found.')}
            </div>
          )}
        </div>
      )}

      {activeTab === 'library' && (
        <WorkoutLibrary workouts={libraryWorkouts} onCreate={handleCreateTemplate} onEdit={handleEditTemplate} onDelete={handleDeleteTemplate} />
      )}

      {activeTab === 'ai' && (
        <AIWorkoutGenerator onSave={(w) => { addWorkout(w); setActiveTab('library') }} />
      )}

      {isEditorOpen && (
        <WorkoutEditorModal 
          isOpen={isEditorOpen} 
          onClose={() => { setIsEditorOpen(false); setSelectedClient(null); }} 
          onSave={handleSaveWorkout} 
          initialData={editingWorkout}
          client={selectedClient || undefined}
        />
      )}
      
      {isSessionModalOpen && selectedClient && (
        <SessionLogModal 
          clientId={selectedClient.id} 
          onClose={() => { setIsSessionModalOpen(false); setSelectedClient(null); }} 
          onSave={(session) => { addSession(session); setIsSessionModalOpen(false); setSelectedClient(null); }} 
        />
      )}

      {isEvalModalOpen && selectedClient && (
        <EvaluationModal 
          clientId={selectedClient.id} 
          onClose={() => { setIsEvalModalOpen(false); setSelectedClient(null); }} 
          onSave={(ev) => { addEvaluation(ev); setIsEvalModalOpen(false); setSelectedClient(null); }} 
        />
      )}
    </div>
  )
}
