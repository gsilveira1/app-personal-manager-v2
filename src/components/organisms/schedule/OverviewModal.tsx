import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon, Clock } from 'lucide-react'
import { parseISO } from 'date-fns'
import { Card, Badge, Button, Label } from '../../atoms'
import { formatLocalized } from '../../../utils/dateLocale'
import { type Client, type Session, type WorkoutPlan } from '../../../types'

const OverviewModal = ({ isOpen, onClose, sessions, clients, headerText, workouts }: any) => {
  const { t } = useTranslation('schedule')
  const { t: tc } = useTranslation('clients')
  const { t: tco } = useTranslation('common')
  const [activeTab, setActiveTab] = useState<'total' | 'completed' | 'pending'>('total')
  const [viewingSession, setViewingSession] = useState<Session | null>(null)

  const filteredSessions = useMemo(() => {
    const sorted = [...sessions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    if (activeTab === 'completed') return sorted.filter((s) => s.completed)
    if (activeTab === 'pending') return sorted.filter((s) => !s.completed)
    return sorted
  }, [sessions, activeTab])

  useEffect(() => {
    // Reset view when modal is reopened or sessions change
    if (isOpen) setViewingSession(null)
  }, [isOpen, sessions])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-3xl bg-white shadow-xl animate-in fade-in zoom-in duration-200 overflow-hidden flex flex-col max-h-[90vh]">
        {!viewingSession ? (
          <>
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900">{headerText}</h2>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-4 border-b border-slate-200 flex space-x-2">
              <button onClick={() => setActiveTab('total')} className={`px-3 py-1 text-sm font-medium rounded-md ${activeTab === 'total' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100'}`}>
                {t('total')}{' '}
                <Badge variant="default" className="ml-1.5 bg-white text-indigo-700">
                  {sessions.length}
                </Badge>
              </button>
              <button onClick={() => setActiveTab('completed')} className={`px-3 py-1 text-sm font-medium rounded-md ${activeTab === 'completed' ? 'bg-green-600 text-white' : 'hover:bg-slate-100'}`}>
                {t('completed')}{' '}
                <Badge variant="default" className="ml-1.5 bg-white text-green-700">
                  {sessions.filter((s: any) => s.completed).length}
                </Badge>
              </button>
              <button onClick={() => setActiveTab('pending')} className={`px-3 py-1 text-sm font-medium rounded-md ${activeTab === 'pending' ? 'bg-amber-600 text-white' : 'hover:bg-slate-100'}`}>
                {t('pending')}{' '}
                <Badge variant="default" className="ml-1.5 bg-white text-amber-700">
                  {sessions.filter((s: any) => !s.completed).length}
                </Badge>
              </button>
            </div>
            <div className="overflow-y-auto p-4 space-y-3">
              {filteredSessions.length > 0 ? (
                filteredSessions.map((session: Session) => {
                  const client = clients.find((c: Client) => c.id === session.clientId)
                  return (
                    <div
                      key={session.id}
                      onClick={() => setViewingSession(session)}
                      className="p-3 rounded-lg border border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-50 hover:border-indigo-300"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-2 h-10 rounded-full ${session.completed ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                        <div>
                          <p className="font-semibold text-slate-800">{client?.name || tco('unknown')}</p>
                          <p className="text-xs text-slate-500">
                            {formatLocalized(parseISO(session.date), 'MMM d, h:mm a')} • {session.category === 'Check-in' ? tc('checkIn') : tc('workout')}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-400" />
                    </div>
                  )
                })
              ) : (
                <p className="text-center py-8 text-slate-500">{t('noSessionsInCategory')}</p>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <button onClick={() => setViewingSession(null)} className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800">
                <ChevronLeft className="h-4 w-4 mr-1" /> {t('backToList')}
              </button>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="overflow-y-auto">
              <SessionDetailView session={viewingSession} clients={clients} workouts={workouts} />
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

const SessionDetailView = ({ session, clients, workouts }: any) => {
  const { t } = useTranslation('schedule')
  const client = clients.find((c: Client) => c.id === session.clientId)
  const workout = workouts.find((w: WorkoutPlan) => w.id === session.linkedWorkoutId)
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center space-x-4">
        <img src={client?.avatar} alt={client?.name} className="h-12 w-12 rounded-full object-cover" />
        <div>
          <h3 className="text-xl font-bold text-slate-900">{client?.name}</h3>
          <div className="flex items-center text-sm text-slate-500 gap-x-3">
            <span className="flex items-center">
              <CalendarIcon className="h-3 w-3 mr-1" /> {formatLocalized(parseISO(session.date), 'EEEE, MMM d, yyyy')}
            </span>
            <span className="flex items-center">
              <Clock className="h-3 w-3 mr-1" /> {formatLocalized(parseISO(session.date), 'h:mm a')}
            </span>
          </div>
        </div>
      </div>
      <Badge variant={session.completed ? 'success' : 'warning'}>{session.completed ? t('completed') : t('pending')}</Badge>
      {session.notes && (
        <div>
          <Label>{t('sessionDetails')}</Label>
          <p className="text-sm p-3 bg-slate-50 rounded-md border border-slate-200 whitespace-pre-wrap">{session.notes}</p>
        </div>
      )}
      {workout && (
        <div>
          <Label>{`${t('linkedWorkout')}: ${workout.title}`}</Label>
          <div className="p-3 bg-slate-50 rounded-md border border-slate-200 space-y-2 text-sm">
            {workout.exercises.map((ex: any, i: number) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-slate-700">{ex.name}</span>
                <span className="text-slate-500 font-mono text-xs">
                  {ex.sets} x {ex.reps}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export { OverviewModal, SessionDetailView }
