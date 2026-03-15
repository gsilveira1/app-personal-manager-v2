import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Calendar as CalendarIcon, Clock, User, ArrowUpRight, Save, X, Edit2 } from 'lucide-react'
import { parseISO } from 'date-fns'
import { Card, Button, Label, Select } from '../../atoms'
import { formatLocalized } from '../../../utils/dateLocale'
import { type Client, type WorkoutPlan } from '../../../types'

const SessionDetailsModal = ({ session, clients, workouts, onClose, onUpdate, onEdit }: any) => {
  const { t } = useTranslation('schedule')
  const { t: tc } = useTranslation('common')
  const client = clients.find((c: Client) => c.id === session.clientId)
  const [notes, setNotes] = useState(session.notes || '')
  const [linkedWorkoutId, setLinkedWorkoutId] = useState(session.linkedWorkoutId || '')
  const handleSave = () => {
    onUpdate(session.id, { notes, linkedWorkoutId: linkedWorkoutId || undefined })
    onClose()
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-2xl bg-white shadow-xl animate-in fade-in zoom-in duration-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-start">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
              {client?.avatar ? <img src={client.avatar} alt={client.name} className="h-full w-full object-cover" /> : <User className="h-6 w-6 text-slate-400" />}
            </div>
            <div className="min-w-0">
              <Link to={`/clients/${client?.id}`} className="group flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-indigo-600 truncate">{client?.name || '...'}</h2>
                <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600" />
              </Link>
              <div className="flex flex-wrap items-center text-slate-500 text-sm gap-x-3">
                <span className="flex items-center">
                  <CalendarIcon className="h-3 w-3 mr-1" /> {formatLocalized(parseISO(session.date), 'MMM d, yyyy')}
                </span>
                <span className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" /> {formatLocalized(parseISO(session.date), 'h:mm a')}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
            <div>
              <span className="text-sm font-medium text-slate-500">{t('status')}</span>
              <span className={`font-bold block ${session.completed ? 'text-green-600' : 'text-amber-600'}`}>{session.completed ? t('completed') : t('pending')}</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  onEdit(session)
                  onClose()
                }}
              >
                <Edit2 className="h-4 w-4 mr-2" /> {t('editSession')}
              </Button>
              <Button variant={session.completed ? 'secondary' : 'primary'} onClick={() => onUpdate(session.id, { completed: !session.completed })}>
                {session.completed ? t('pending') : t('markComplete')}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t('sessionDetails')}</Label>
            <textarea
              className="w-full min-h-[100px] p-3 text-sm border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
              placeholder={t('recordPerformancePlaceholder')}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          {session.category === 'Workout' && (
            <div className="space-y-3 border-t pt-4">
              <Label>{t('trainingPlan')}</Label>
              <Select value={linkedWorkoutId} onChange={(e) => setLinkedWorkoutId(e.target.value)}>
                <option value="">{t('noSpecificPlan')}</option>
                {workouts
                  .filter((w: WorkoutPlan) => !w.clientId || w.clientId === client?.id)
                  .map((w: WorkoutPlan) => (
                    <option key={w.id} value={w.id}>
                      {w.title}
                    </option>
                  ))}
              </Select>
            </div>
          )}
        </div>
        <div className="p-4 border-t bg-slate-50 flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose}>
            {tc('cancel')}
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" /> {t('saveSession')}
          </Button>
        </div>
      </Card>
    </div>
  )
}

export { SessionDetailsModal }
