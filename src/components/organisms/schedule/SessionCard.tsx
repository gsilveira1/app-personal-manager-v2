import { useTranslation } from 'react-i18next'
import { Clock, MapPin, Video, Repeat } from 'lucide-react'
import { parseISO } from 'date-fns'
import { Card } from '../../atoms'
import { formatLocalized } from '../../../utils/dateLocale'

const SessionCard = ({ session, client, onClick, onToggle, onDragStart, onDragEnd, isDragged }: any) => {
  const { t } = useTranslation('schedule')
  const { t: tc } = useTranslation('clients')
  const { t: tco } = useTranslation('common')
  return (
    <Card
      draggable="true"
      onDragStart={(e) => onDragStart(e, session.id)}
      onDragEnd={onDragEnd}
      className={`p-3 sm:p-4 transition-all hover:shadow-md cursor-pointer group ${session.completed ? 'opacity-70 bg-slate-50' : 'bg-white hover:border-indigo-300'} ${isDragged ? 'opacity-50 ring-2 ring-indigo-500' : ''}`}
      onClick={onClick}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-start space-x-3 sm:space-x-4">
          <div
            className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm whitespace-nowrap font-semibold ${session.category === 'Check-in' ? 'bg-purple-100 text-purple-700' : 'bg-indigo-50 text-indigo-700'}`}
          >
            {formatLocalized(parseISO(session.date), 'h:mm a')}
          </div>
          <div>
            <h4 className="font-semibold text-sm sm:text-base text-slate-900 flex items-center gap-2 group-hover:text-indigo-700">
              {client?.name || tco('unknownClient')}
              {session.recurrenceId && (
                <span title={t('recurringSession')}>
                  <Repeat className="h-3 w-3 text-slate-400" />
                </span>
              )}
            </h4>
            <div className="flex flex-wrap items-center text-xs text-slate-500 mt-1 gap-x-3 gap-y-1">
              <span className="flex items-center">
                <Clock className="h-3 w-3 mr-1" /> {session.durationMinutes} min
              </span>
              <span className="flex items-center">
                {session.type === 'Online' ? <Video className="h-3 w-3 mr-1" /> : <MapPin className="h-3 w-3 mr-1" />}
                {session.type === 'Online' ? tc('online') : tc('inPerson')}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end sm:justify-start space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggle(session.id)
            }}
            className={`text-xs px-3 py-1.5 rounded-full border ${session.completed ? 'bg-green-100 text-green-700 border-green-200' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            {session.completed ? t('completed') : t('markComplete')}
          </button>
        </div>
      </div>
    </Card>
  )
}

export { SessionCard }
