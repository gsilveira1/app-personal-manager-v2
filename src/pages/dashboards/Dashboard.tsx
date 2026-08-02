import { Calendar, UserPlus, AlertCircle, Activity } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { Button } from '../../components/atoms'
import { StatCard } from '../../components/molecules/StatCard'
import { ConflictsCard } from '../../components/organisms/dashboard/ConflictsCard'
import { TodayAgenda } from '../../components/organisms/dashboard/TodayAgenda'
import { ClientWatchlist } from '../../components/organisms/dashboard/ClientWatchlist'
import { WeeklyOverviewCard } from '../../components/organisms/dashboard/WeeklyOverviewCard'
import { useDashboard } from '../../hooks/useDashboard'

/**
 * Dashboard page displaying statistics, today's agenda, and weekly overview.
 */
export const Dashboard = () => {
  const { t } = useTranslation('navigation')
  const { t: ts } = useTranslation('schedule')
  const { t: tc } = useTranslation('clients')
  
  const {
    clients,
    conflicts,
    todaySessions,
    weeklySessions,
    newLeads,
    activeClients,
    weeklyScheduleData,
    clientsToWatch,
    toggleSessionComplete
  } = useDashboard()

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
          <WeeklyOverviewCard data={weeklyScheduleData} />
        </div>
      </div>
    </div>
  )
}
