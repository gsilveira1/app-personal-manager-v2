import { useMemo } from 'react'
import { Calendar, UserPlus, AlertCircle, Activity } from 'lucide-react'
import { isSameDay, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, isAfter, subDays } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { useStore } from '../store/store'
import { Card, Button } from '../components/atoms'
import { StatCard } from '../components/molecules/StatCard'
import { formatLocalized } from '../utils/dateLocale'
import { ClientStatus } from '../types'
import { findSchedulingConflicts } from '../utils/scheduleUtils'
import { ConflictsCard } from '../components/organisms/dashboard/ConflictsCard'
import { TodayAgenda } from '../components/organisms/dashboard/TodayAgenda'
import { ClientWatchlist } from '../components/organisms/dashboard/ClientWatchlist'

export const Dashboard = () => {
  const { t } = useTranslation('navigation')
  const { t: ts } = useTranslation('schedule')
  const { t: tc } = useTranslation('clients')
  const { clients, sessions, toggleSessionComplete } = useStore()

  const conflicts = useMemo(() => findSchedulingConflicts(sessions), [sessions])
  const today = new Date()
  const weekStart = startOfWeek(today, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 })

  const todaySessions = sessions.filter((s) => isSameDay(parseISO(s.date), today))
  const weeklySessions = sessions.filter((s) => { const d = parseISO(s.date); return d >= weekStart && d <= weekEnd })
  const newLeads = clients.filter((c) => c.status === ClientStatus.Lead).length
  const activeClients = clients.filter((c) => c.status === ClientStatus.Active).length

  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })
  const weeklyScheduleData = weekDays.map((day) => ({
    name: formatLocalized(day, 'EEE'),
    sessions: sessions.filter((s) => isSameDay(parseISO(s.date), day)).length,
  }))

  const clientsToWatch = clients
    .filter((client) => {
      if (client.status !== ClientStatus.Active) return false
      const clientSessions = sessions.filter((s) => s.clientId === client.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      if (clientSessions.length === 0) return true
      return isAfter(subDays(today, 14), parseISO(clientSessions[0].date))
    })
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('dashboard')}</h1>
          <p className="text-slate-500">{t('welcomeSubtitle')}</p>
        </div>
        <Link to="/schedule"><Button>+ {ts('newSession')}</Button></Link>
      </div>

      {conflicts.length > 0 && <ConflictsCard conflicts={conflicts} />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={ts('sessionsToday')} value={todaySessions.length.toString()} icon={Calendar} description={`${todaySessions.filter((s) => s.completed).length} ${ts('completed').toLowerCase()}`} />
        <StatCard title={ts('thisWeeksSessions')} value={weeklySessions.length.toString()} icon={Activity} description={`${weeklySessions.filter((s) => !s.completed).length} ${ts('pending').toLowerCase()}`} />
        <StatCard title={tc('newLeads')} value={newLeads.toString()} icon={UserPlus} description={tc('readyToContact')} />
        <StatCard title={tc('activeClients')} value={activeClients.toString()} icon={AlertCircle} description={tc('currentlyActive')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <TodayAgenda sessions={todaySessions} clients={clients} onToggleComplete={toggleSessionComplete} />
        </div>
        <div className="lg:col-span-1 space-y-6">
          <ClientWatchlist clients={clientsToWatch} />
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
