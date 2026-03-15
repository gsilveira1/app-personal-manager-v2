import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isSameMonth, isToday, parseISO } from 'date-fns'
import { type Session, type Client } from '../../../types'

const MonthView = ({ date, sessions, clients, onDayClick }: any) => {
  const monthStart = startOfMonth(date)
  const calendarDays = eachDayOfInterval({ start: startOfWeek(monthStart, { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(monthStart), { weekStartsOn: 1 }) })
  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div key={day} className="py-2 text-center text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 auto-rows-[60px] sm:auto-rows-[100px] divide-x divide-y divide-slate-200">
        {calendarDays.map((day) => (
          <div
            key={day.toISOString()}
            onClick={() => onDayClick(day)}
            className={`p-1 sm:p-2 flex flex-col justify-between hover:bg-slate-50 cursor-pointer transition-colors ${!isSameMonth(day, monthStart) ? 'bg-slate-50/50' : ''}`}
          >
            <div className="flex justify-between items-start">
              <span
                className={`text-[10px] sm:text-sm font-medium h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center rounded-full ${isToday(day) ? 'bg-indigo-600 text-white' : !isSameMonth(day, monthStart) ? 'text-slate-400' : 'text-slate-700'}`}
              >
                {format(day, 'd')}
              </span>
              {sessions.filter((s: Session) => isSameDay(parseISO(s.date), day)).length > 0 && (
                <span className="hidden sm:inline-block text-[10px] font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full">
                  {sessions.filter((s: Session) => isSameDay(parseISO(s.date), day)).length}
                </span>
              )}
            </div>
            <div className="flex sm:hidden flex-wrap gap-0.5 mt-1 content-start h-full">
              {sessions
                .filter((s: Session) => isSameDay(parseISO(s.date), day))
                .map((session: Session) => (
                  <div key={session.id} className={`w-1.5 h-1.5 rounded-full ${session.completed ? 'bg-green-500' : 'bg-indigo-500'}`} />
                ))}
            </div>
            <div className="hidden sm:block space-y-1 mt-1 overflow-hidden">
              {sessions
                .filter((s: Session) => isSameDay(parseISO(s.date), day))
                .slice(0, 3)
                .map((session: Session) => (
                  <div key={session.id} className="flex items-center gap-1 text-[10px] truncate">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${session.completed ? 'bg-green-500' : 'bg-indigo-500'}`}></div>
                    <span className={`${!isSameMonth(day, monthStart) ? 'text-slate-400' : 'text-slate-600'}`}>{clients.find((c: Client) => c.id === session.clientId)?.name.split(' ')[0]}</span>
                  </div>
                ))}
              {sessions.filter((s: Session) => isSameDay(parseISO(s.date), day)).length > 3 && (
                <div className="text-[10px] text-slate-400 pl-2.5">+ {sessions.filter((s: Session) => isSameDay(parseISO(s.date), day)).length - 3} more</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export { MonthView }
