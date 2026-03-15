import { format, addDays, startOfWeek, isSameDay, isToday, setHours, parseISO } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { type Session, type Client } from '../../../types'
import { formatLocalized } from '../../../utils/dateLocale'
import { SessionCard } from './SessionCard'

const WeekView = ({ date, sessions, clients, onSessionClick, onToggleComplete, onAreaClick, dragHandlers }: any) => {
  const { t } = useTranslation('schedule')
  const { handleDragStart, handleDrop, handleDragOver, handleDragEnd, setDragOverId, draggedItemId, dragOverId } = dragHandlers
  const start = startOfWeek(date, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(start, i))

  return (
    <div className="space-y-6">
      {weekDays.map((day) => {
        const dayIdentifier = day.toISOString().split('T')[0]

        return (
          <div
            key={day.toISOString()}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, day, false)}
            onDragEnter={() => setDragOverId(dayIdentifier)}
            onDragLeave={() => setDragOverId(null)}
            className={`relative p-2 rounded-xl transition-colors ${isToday(day) ? 'bg-indigo-50/50 -mx-4 px-4 py-2 border border-indigo-100' : ''} ${dragOverId === dayIdentifier ? 'bg-indigo-100' : ''}`}
          >
            <div className="flex items-start gap-4">
              <div className="w-14 shrink-0 flex flex-col items-center">
                <span className="text-sm font-medium text-slate-500 uppercase">{formatLocalized(day, 'EEE')}</span>
                <span className={`text-xl font-bold mt-1 h-10 w-10 flex items-center justify-center rounded-full ${isToday(day) ? 'bg-indigo-600 text-white' : 'text-slate-900'}`}>
                  {format(day, 'd')}
                </span>
              </div>
              <div className="flex-1 space-y-3 pt-1">
                {sessions.filter((s: Session) => isSameDay(parseISO(s.date), day)).length === 0 ? (
                  <div
                    onClick={() => onAreaClick(setHours(day, 9))}
                    className="h-12 border border-dashed border-slate-200 rounded-lg flex items-center justify-center text-sm text-slate-400 hover:bg-slate-50 hover:border-indigo-300 hover:text-indigo-500 cursor-pointer transition-colors"
                  >
                    {t('noSessionsClickToAdd')}
                  </div>
                ) : (
                  sessions
                    .filter((s: Session) => isSameDay(parseISO(s.date), day))
                    .sort((a: Session, b: Session) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map((session: Session) => (
                      <SessionCard
                        key={session.id}
                        session={session}
                        client={clients.find((c: Client) => c.id === session.clientId)}
                        onClick={() => onSessionClick(session)}
                        onToggle={onToggleComplete}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        isDragged={draggedItemId === session.id}
                      />
                    ))
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export { WeekView }
