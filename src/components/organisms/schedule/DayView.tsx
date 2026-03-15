import { Plus } from 'lucide-react'
import { format, setHours, startOfDay, getHours, isSameDay, parseISO } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { type Session } from '../../../types'
import { formatLocalized } from '../../../utils/dateLocale'
import { SessionCard } from './SessionCard'
import { type Client } from '../../../types'

const DayView = ({ date, sessions, clients, onSessionClick, onToggleComplete, onAreaClick, dragHandlers }: any) => {
  const { t } = useTranslation('schedule')
  const { handleDragStart, handleDrop, handleDragOver, handleDragEnd, setDragOverId, draggedItemId, dragOverId } = dragHandlers
  const hours = Array.from({ length: 17 }, (_, i) => i + 6)
  const daySessions = sessions.filter((s: Session) => isSameDay(parseISO(s.date), date))

  return (
    <div className="space-y-2">
      {hours.map((hour: number) => {
        const hourIdentifier = `${format(date, 'yyyy-MM-dd')}-${hour}`
        const targetDate = setHours(startOfDay(date), hour)

        return (
          <div key={hour} className="flex gap-4 group">
            <div className="w-16 sm:w-20 text-right text-sm text-slate-400 pt-3 font-medium shrink-0">{formatLocalized(setHours(new Date(), hour), 'h:00 a')}</div>
            <div
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, targetDate, true)}
              onDragEnter={() => setDragOverId(hourIdentifier)}
              onDragLeave={() => setDragOverId(null)}
              className={`flex-1 min-h-[80px] border-l-2 pl-4 py-2 relative rounded-r-lg transition-colors ${dragOverId === hourIdentifier ? 'bg-indigo-50 border-indigo-300' : 'border-slate-100'}`}
            >
              <div className="absolute top-3 left-0 w-full border-t border-slate-100 -z-10"></div>
              {daySessions
                .filter((s: Session) => getHours(parseISO(s.date)) === hour)
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
                ))[0] || (
                  <div
                    onClick={() => onAreaClick(targetDate)}
                    className="h-full w-full rounded-lg border-2 border-dashed border-transparent hover:border-slate-200 hover:bg-slate-50 transition-all cursor-pointer flex items-center justify-center opacity-0 group-hover:opacity-100"
                  >
                    <span className="text-slate-400 text-sm font-medium flex items-center">
                      <Plus className="h-4 w-4 mr-1" /> <span className="hidden sm:inline">{t('scheduleSession')}</span>
                      <span className="sm:hidden">{t('addShort')}</span>
                    </span>
                  </div>
                )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export { DayView }
