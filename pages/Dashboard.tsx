import React from 'react';
import { useStore } from '../store';
import { Card } from '../components/ui';
import { Users, Calendar, DollarSign, TrendingUp, CheckCircle2, Clock, Video, MapPin } from 'lucide-react';
// FIX: Use ESM submodule imports for date-fns to ensure correct module resolution.
import format from 'date-fns/format';
import isSameDay from 'date-fns/isSameDay';
import parseISO from 'date-fns/parseISO';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';

export const Dashboard = () => {
  const { clients, sessions, finances } = useStore();

  const activeClients = clients.filter(c => c.status === 'Active').length;
  const todaySessions = sessions.filter(s => isSameDay(parseISO(s.date), new Date()));
  const totalRevenue = finances.reduce((acc, curr) => acc + curr.amount, 0);
  
  // Prepare chart data (Last 6 finance records for simplicity)
  const chartData = finances.slice(-6).map(f => ({
    name: format(parseISO(f.date), 'MMM d'),
    amount: f.amount
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500">Welcome back, Coach Alex. Here's your daily overview.</p>
        </div>
        <div className="text-sm text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Active Clients" 
          value={activeClients.toString()} 
          icon={Users} 
          trend="+2 this month" 
          trendUp={true}
        />
        <StatsCard 
          title="Sessions Today" 
          value={todaySessions.length.toString()} 
          icon={Calendar} 
          trend="Next at 2:00 PM"
          trendUp={true} 
        />
        <StatsCard 
          title="Total Revenue" 
          value={`$${totalRevenue.toLocaleString()}`} 
          icon={DollarSign} 
          trend="+12% from last month"
          trendUp={true} 
        />
        <StatsCard 
          title="Completion Rate" 
          value="94%" 
          icon={TrendingUp} 
          trend="Top 5% of trainers"
          trendUp={true} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Revenue Overview</h3>
            <Link to="/finances" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">View Report</Link>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  cursor={{fill: '#f1f5f9'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="amount" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Today's Schedule</h3>
          <div className="space-y-4">
            {todaySessions.length === 0 ? (
              <p className="text-slate-500 text-sm">No sessions scheduled for today.</p>
            ) : (
              todaySessions.map((session) => {
                const client = clients.find(c => c.id === session.clientId);
                return (
                  <div key={session.id} className="flex items-start space-x-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <div className={`p-2 rounded-full ${session.category === 'Check-in' ? 'bg-purple-100 text-purple-600' : 'bg-indigo-100 text-indigo-600'}`}>
                       {session.category === 'Check-in' ? <Video className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                    </div>
                    <div>
                      {client ? (
                          <Link to={`/clients/${client.id}`} className="font-medium text-slate-900 hover:text-indigo-600 transition-colors">
                              {client.name}
                          </Link>
                      ) : (
                          <p className="font-medium text-slate-900">Unknown Client</p>
                      )}
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        {format(parseISO(session.date), 'h:mm a')} • 
                        {session.category} • 
                        {session.durationMinutes} min
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <Link to="/schedule" className="block w-full text-center mt-2 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-md border border-dashed border-slate-300 transition-colors">
              + Quick Add Session
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

const StatsCard = ({ title, value, icon: Icon, trend, trendUp }: any) => (
  <Card className="p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
      </div>
      <div className="bg-slate-100 p-3 rounded-xl">
        <Icon className="h-5 w-5 text-slate-600" />
      </div>
    </div>
    <div className="mt-4 flex items-center text-xs">
      <span className={`font-medium ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
        {trend}
      </span>
    </div>
  </Card>
);