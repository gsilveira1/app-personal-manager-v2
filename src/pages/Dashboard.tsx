import React, { useMemo } from 'react'
import { Calendar, UserPlus, AlertCircle, CheckCircle2, Video, MapPin, Activity, AlertTriangle } from 'lucide-react'
import { format, isSameDay, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, isAfter, subDays } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useNavigate } from 'react-router'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { useStore } from '../store/store'
import { Card, Button } from '../components/ui'
import { ClientStatus, type Session } from '../types'
import { findSchedulingConflicts } from '../utils/scheduleUtils'

export const Dashboard = () => {
  const { t } = useTranslation('navigation')
  const { t: ts } = useTranslation('schedule')
  const { t: tc } = useTranslation('clients')
  const { t: tco } = useTranslation('common')
  const { clients, sessions, toggleSessionComplete } = useStore()

  const conflicts = useMemo(() => findSchedulingConflicts(sessions), [sessions])

  const today = new Date()
  const weekStart = startOfWeek(today, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 })

  // --- New Stats Calculations ---
  const todaySessions = sessions.filter((s) => isSameDay(parseISO(s.date), today))
  const weeklySessions = sessions.filter((s) => {
    const d = parseISO(s.date)
    return d >= weekStart && d <= weekEnd
  })
  const newLeads = clients.filter((c) => c.status === ClientStatus.Lead).length
  const activeClients = clients.filter((c) => c.status === ClientStatus.Active).length

  // --- New Chart Data: Weekly Schedule ---
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })
  const weeklyScheduleData = weekDays.map((day) => ({
    name: format(day, 'EEE'),
    sessions: sessions.filter((s) => isSameDay(parseISO(s.date), day)).length,
  }))

  // --- New Component Data: Client Watchlist ---
  const clientsToWatch = clients
    .filter((client) => {
      if (client.status !== ClientStatus.Active) return false
      const clientSessions = sessions.filter((s) => s.clientId === client.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      if (clientSessions.length === 0) return true // Active but no sessions ever

      const lastSessionDate = parseISO(clientSessions[0].date)
      return isAfter(subDays(today, 14), lastSessionDate) // Last session was more than 14 days ago
    })
    .slice(0, 5) // Limit to 5 for UI

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('dashboard')}</h1>
          <p className="text-slate-500">{t('welcomeSubtitle')}</p>
        </div>
        <Link to="/schedule">
          <Button>+ {ts('newSession')}</Button>
        </Link>
      </div>

      {conflicts.length > 0 && <ConflictsCard conflicts={conflicts} />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title={ts('sessionsToday')} value={todaySessions.length.toString()} icon={Calendar} description={`${todaySessions.filter((s) => s.completed).length} ${ts('completed').toLowerCase()}`} />
        <StatsCard title={ts('thisWeeksSessions')} value={weeklySessions.length.toString()} icon={Activity} description={`${weeklySessions.filter((s) => !s.completed).length} ${ts('pending').toLowerCase()}`} />
        <StatsCard title={tc('newLeads')} value={newLeads.toString()} icon={UserPlus} description={tc('readyToContact')} />
        <StatsCard title={tc('activeClients')} value={activeClients.toString()} icon={AlertCircle} description={tc('currentlyActive')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-0">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-900">{ts('todaysAgenda')}</h3>
              <p className="text-sm text-slate-500">{format(today, 'EEEE, MMMM d')}</p>
            </div>
            <div className="p-6 space-y-4">
              {todaySessions.length === 0 ? (
                <div className="text-center py-10">
                  <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <h4 className="text-lg font-medium text-slate-900">{ts('allClear')}</h4>
                  <p className="text-slate-500 text-sm">{ts('noSessionsForToday')}</p>
                </div>
              ) : (
                todaySessions
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((session) => {
                    const client = clients.find((c) => c.id === session.clientId)
                    return (
                      <div
                        key={session.id}
                        className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-lg border transition-all ${session.completed ? 'bg-slate-50 opacity-75' : 'bg-white'}`}
                      >
                        <div className="flex items-center space-x-4">
                          <span className="font-bold text-indigo-600 text-sm w-16 text-center">{format(parseISO(session.date), 'h:mm a')}</span>
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
                            <Button variant="outline" onClick={() => toggleSessionComplete(session.id)}>
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
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">{tc('clientWatchlist')}</h3>
            <div className="space-y-3">
              {clientsToWatch.length > 0 ? (
                clientsToWatch.map((client) => (
                  <div key={client.id} className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <img src={client.avatar} alt={client.name} className="h-9 w-9 rounded-full object-cover" />
                      <div>
                        <Link to={`/clients/${client.id}`} className="text-sm font-semibold text-slate-800 hover:text-indigo-600">
                          {client.name}
                        </Link>
                        <p className="text-xs text-slate-400">{tc('needsFollowUp')}</p>
                      </div>
                    </div>
                    <Link to={`/clients/${client.id}`}>
                      <Button variant="secondary" className="h-8 px-3 text-xs">
                        {tco('view')}
                      </Button>
                    </Link>
                  </div>
                ))
              ) : (
                <p className="text-center text-sm text-slate-500 py-4">{tc('noClientsToWatch')}</p>
              )}
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">{ts('weeklyOverview')}</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyScheduleData} margin={{ top: 5, right: 0, left: -20, bottom: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} allowDecimals={false} />
                  <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="sessions" fill="#818cf8" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

const StatsCard = ({ title, value, icon: Icon, description, isAlert }: { title: string; value: string; icon: React.ElementType; description: string; isAlert?: boolean }) => (
  <Card className="p-6">
    <div className="flex items-center justify-between">
      <div className={`p-3 rounded-xl ${isAlert ? 'bg-red-100' : 'bg-slate-100'}`}>
        <Icon className={`h-5 w-5 ${isAlert ? 'text-red-600' : 'text-slate-600'}`} />
      </div>
    </div>
    <div className="mt-2">
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm font-medium text-slate-500">{title}</p>
    </div>
    <p className={`mt-3 text-xs ${isAlert ? 'text-red-500 font-medium' : 'text-slate-400'}`}>{description}</p>
  </Card>
)

const ConflictsCard = ({ conflicts }: { conflicts: Session[][] }) => {
  const { clients } = useStore()
  const { t } = useTranslation('schedule')
  const navigate = useNavigate()

  return (
    <Card className="col-span-full bg-red-50 border-red-200 animate-in fade-in">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-red-900">
              {t('conflictsDetected', { count: conflicts.length })}
            </h3>
            <p className="text-sm text-red-700">{t('conflictsMessage')}</p>
          </div>
        </div>
        <div className="mt-4 space-y-3 max-h-48 overflow-y-auto pr-2">
          {conflicts.map((group, index) => (
            <div key={index} className="p-3 bg-white rounded-md border border-red-200">
              <p className="text-xs font-semibold text-red-800 mb-2">{t('conflictGroup', { index: index + 1 })}</p>
              <div className="space-y-1">
                {group.map((session) => {
                  const client = clients.find((c) => c.id === session.clientId)
                  return (
                    <div key={session.id} className="flex justify-between items-center text-sm">
                      <span className="font-medium text-slate-700">{client?.name || '...'}</span>
                      <span className="text-slate-500">{format(parseISO(session.date), 'MMM d, h:mm a')}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
        <Button variant="danger" className="mt-4 w-full" onClick={() => navigate('/schedule')}>
          {t('resolveConflicts')}
        </Button>
      </div>
    </Card>
  )
}
