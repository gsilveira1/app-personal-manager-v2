import React from 'react'
import { Calendar, CheckCircle2, Video, MapPin } from 'lucide-react'
import { parseISO } from 'date-fns'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import type { Session, Client } from '../../../types'
import { Card, Button } from '../../atoms'
import { formatLocalized } from '../../../utils/dateLocale'

interface TodayAgendaProps {
  sessions: Session[]
  clients: Client[]
  onToggleComplete: (sessionId: string) => void
}

export const TodayAgenda: React.FC<TodayAgendaProps> = ({ sessions, clients, onToggleComplete }) => {
  const { t: ts } = useTranslation('schedule')
  const { t: tc } = useTranslation('clients')
  const { t: tco } = useTranslation('common')
  const today = new Date()

  return (
    <Card className="p-0">
      <div className="p-6 border-b border-slate-100">
        <h3 className="text-lg font-semibold text-slate-900">{ts('todaysAgenda')}</h3>
        <p className="text-sm text-slate-500">{formatLocalized(today, 'EEEE, MMMM d')}</p>
      </div>
      <div className="p-6 space-y-4">
        {sessions.length === 0 ? (
          <div className="text-center py-10">
            <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-lg font-medium text-slate-900">{ts('allClear')}</h4>
            <p className="text-slate-500 text-sm">{ts('noSessionsForToday')}</p>
          </div>
        ) : (
          sessions
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map((session) => {
              const client = clients.find((c) => c.id === session.clientId)
              return (
                <div
                  key={session.id}
                  className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-lg border transition-all ${session.completed ? 'bg-slate-50 opacity-75' : 'bg-white'}`}
                >
                  <div className="flex items-center space-x-4">
                    <span className="font-bold text-indigo-600 text-sm w-16 text-center">{formatLocalized(parseISO(session.date), 'h:mm a')}</span>
                    <img src={client?.avatar} alt={client?.name} className="h-10 w-10 rounded-full object-cover" />
                    <div>
                      <Link to={`/clients/${client?.id}`} className="font-semibold text-slate-800 hover:text-indigo-600">
                        {client?.name || tco('unknownClient')}
                      </Link>
                      <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                        {session.type === 'Online' ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                        {session.type === 'Online' ? tc('online') : tc('inPerson')} {session.category === 'Check-in' ? tc('checkIn') : tc('workout')} • {session.durationMinutes} min
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 shrink-0 w-full sm:w-auto">
                    {session.completed ? (
                      <span className="flex items-center text-sm font-medium text-green-600">
                        <CheckCircle2 className="h-4 w-4 mr-2" /> {ts('completed')}
                      </span>
                    ) : (
                      <Button variant="outline" onClick={() => onToggleComplete(session.id)}>
                        <CheckCircle2 className="h-4 w-4 mr-2" /> {ts('markComplete')}
                      </Button>
                    )}
                  </div>
                </div>
              )
            })
        )}
      </div>
    </Card>
  )
}
