import React, { useMemo } from 'react';
import { useStore } from '../store';
import { Card, Button } from '../components/ui';
import { Users, Calendar, UserPlus, AlertCircle, CheckCircle2, Clock, Video, MapPin, Activity, AlertTriangle } from 'lucide-react';
// FIX: Consolidate date-fns imports to resolve module resolution errors.
import { format } from 'date-fns/format';
import { isSameDay } from 'date-fns/isSameDay';
import { parseISO } from 'date-fns/parseISO';
import { startOfWeek } from 'date-fns/startOfWeek';
import { endOfWeek } from 'date-fns/endOfWeek';
import { eachDayOfInterval } from 'date-fns/eachDayOfInterval';
import { isAfter } from 'date-fns/isAfter';
import { subDays } from 'date-fns/subDays';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Link, useNavigate } from 'react-router-dom';
import { ClientStatus, PaymentStatus, Session } from '../types';
import { findSchedulingConflicts } from '../utils/scheduleUtils';

export const Dashboard = () => {
  const { clients, sessions, finances, toggleSessionComplete } = useStore();
  
  const conflicts = useMemo(() => findSchedulingConflicts(sessions), [sessions]);

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

  // --- New Stats Calculations ---
  const todaySessions = sessions.filter(s => isSameDay(parseISO(s.date), today));
  const weeklySessions = sessions.filter(s => {
    const d = parseISO(s.date);
    return d >= weekStart && d <= weekEnd;
  });
  const newLeads = clients.filter(c => c.status === ClientStatus.Lead).length;
  const overduePayments = finances.filter(f => f.status === PaymentStatus.Overdue).length;

  // --- New Chart Data: Weekly Schedule ---
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const weeklyScheduleData = weekDays.map(day => ({
    name: format(day, 'EEE'),
    sessions: sessions.filter(s => isSameDay(parseISO(s.date), day)).length,
  }));
  
  // --- New Component Data: Client Watchlist ---
  const clientsToWatch = clients.filter(client => {
      if (client.status !== ClientStatus.Active) return false;
      const clientSessions = sessions
        .filter(s => s.clientId === client.id)
        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      if (clientSessions.length === 0) return true; // Active but no sessions ever
      
      const lastSessionDate = parseISO(clientSessions[0].date);
      return isAfter(subDays(today, 14), lastSessionDate); // Last session was more than 14 days ago
  }).slice(0, 5); // Limit to 5 for UI

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500">Welcome back, Coach Alex. Here's your daily overview.</p>
        </div>
         <Link to="/schedule">
            <Button>+ New Session</Button>
         </Link>
      </div>

      {conflicts.length > 0 && <ConflictsCard conflicts={conflicts} />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Sessions Today" 
          value={todaySessions.length.toString()} 
          icon={Calendar} 
          description={`${todaySessions.filter(s => s.completed).length} completed`}
        />
        <StatsCard 
          title="This Week's Sessions" 
          value={weeklySessions.length.toString()} 
          icon={Activity}
          description={`${weeklySessions.filter(s => !s.completed).length} pending`}
        />
        <StatsCard 
          title="New Leads" 
          value={newLeads.toString()} 
          icon={UserPlus} 
          description="Ready to be contacted"
        />
        <StatsCard 
          title="Overdue Payments" 
          value={overduePayments.toString()} 
          icon={AlertCircle}
          description="Action required"
          isAlert={overduePayments > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            <Card className="p-0">
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-lg font-semibold text-slate-900">Today's Agenda</h3>
                <p className="text-sm text-slate-500">{format(today, 'EEEE, MMMM d')}</p>
              </div>
              <div className="p-6 space-y-4">
                {todaySessions.length === 0 ? (
                  <div className="text-center py-10">
                    <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <h4 className="text-lg font-medium text-slate-900">All clear!</h4>
                    <p className="text-slate-500 text-sm">No sessions scheduled for today.</p>
                  </div>
                ) : (
                  todaySessions
                    .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map((session) => {
                      const client = clients.find(c => c.id === session.clientId);
                      return (
                        <div key={session.id} className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-lg border transition-all ${session.completed ? 'bg-slate-50 opacity-75' : 'bg-white'}`}>
                           <div className="flex items-center space-x-4">
                              <span className="font-bold text-indigo-600 text-sm w-16 text-center">{format(parseISO(session.date), 'h:mm a')}</span>
                              <img src={client?.avatar} alt={client?.name} className="h-10 w-10 rounded-full object-cover" />
                              <div>
                                  <Link to={`/clients/${client?.id}`} className="font-semibold text-slate-800 hover:text-indigo-600">
                                      {client?.name || 'Unknown Client'}
                                  </Link>
                                  <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                                      {session.type === 'Online' ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                                      {session.type} {session.category} • {session.durationMinutes} min
                                  </p>
                              </div>
                           </div>
                           <div className="flex items-center justify-end gap-2 shrink-0 w-full sm:w-auto">
                              {session.completed ? (
                                <span className="flex items-center text-sm font-medium text-green-600"><CheckCircle2 className="h-4 w-4 mr-2" /> Completed</span>
                              ) : (
                                <Button variant="outline" onClick={() => toggleSessionComplete(session.id)}>
                                    <CheckCircle2 className="h-4 w-4 mr-2" /> Mark Complete
                                </Button>
                              )}
                           </div>
                        </div>
                      );
                    })
                )}
              </div>
            </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Client Watchlist</h3>
            <div className="space-y-3">
              {clientsToWatch.length > 0 ? clientsToWatch.map(client => (
                <div key={client.id} className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                     <img src={client.avatar} alt={client.name} className="h-9 w-9 rounded-full object-cover" />
                     <div>
                       <Link to={`/clients/${client.id}`} className="text-sm font-semibold text-slate-800 hover:text-indigo-600">{client.name}</Link>
                       <p className="text-xs text-slate-400">Needs follow-up</p>
                     </div>
                  </div>
                  <Link to={`/clients/${client.id}`}><Button variant="secondary" className="h-8 px-3 text-xs">View</Button></Link>
                </div>
              )) : (
                <p className="text-center text-sm text-slate-500 py-4">No clients need immediate attention. Great job!</p>
              )}
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Weekly Schedule Overview</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyScheduleData} margin={{ top: 5, right: 0, left: -20, bottom: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} allowDecimals={false} />
                  <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Bar dataKey="sessions" fill="#818cf8" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

const StatsCard = ({ title, value, icon: Icon, description, isAlert }: { title: string, value: string, icon: React.ElementType, description: string, isAlert?: boolean }) => (
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
    <p className={`mt-3 text-xs ${isAlert ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
      {description}
    </p>
  </Card>
);

const ConflictsCard = ({ conflicts }: { conflicts: Session[][] }) => {
  const { clients } = useStore();
  const navigate = useNavigate();

  return (
    <Card className="col-span-full bg-red-50 border-red-200 animate-in fade-in">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-red-900">{conflicts.length} Scheduling Conflict{conflicts.length > 1 ? 's' : ''} Detected</h3>
            <p className="text-sm text-red-700">Some sessions are overlapping. Please resolve them.</p>
          </div>
        </div>
        <div className="mt-4 space-y-3 max-h-48 overflow-y-auto pr-2">
          {conflicts.map((group, index) => (
            <div key={index} className="p-3 bg-white rounded-md border border-red-200">
              <p className="text-xs font-semibold text-red-800 mb-2">Conflict Group {index + 1}</p>
              <div className="space-y-1">
                {group.map(session => {
                  const client = clients.find(c => c.id === session.clientId);
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
          Resolve Conflicts in Schedule
        </Button>
      </div>
    </Card>
  )
}