import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store';
import { Card, Button, Badge, Label, Select, Input } from '../components/ui';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, MapPin, Video, CheckCircle2, User, ArrowUpRight, Dumbbell, Save, X, LayoutGrid, List, CalendarDays, Edit2, Repeat, AlertTriangle, ChevronsLeft, ChevronsRight, Info } from 'lucide-react';
// FIX: Switched to individual submodule imports for date-fns functions to resolve module resolution errors.
import format from 'date-fns/format';
import startOfWeek from 'date-fns/startOfWeek';
import addDays from 'date-fns/addDays';
import isSameDay from 'date-fns/isSameDay';
import parseISO from 'date-fns/parseISO';
import isToday from 'date-fns/isToday';
import startOfMonth from 'date-fns/startOfMonth';
import endOfMonth from 'date-fns/endOfMonth';
import endOfWeek from 'date-fns/endOfWeek';
import eachDayOfInterval from 'date-fns/eachDayOfInterval';
import addMonths from 'date-fns/addMonths';
import addWeeks from 'date-fns/addWeeks';
import isSameMonth from 'date-fns/isSameMonth';
import getHours from 'date-fns/getHours';
import setHours from 'date-fns/setHours';
import startOfDay from 'date-fns/startOfDay';
import add from 'date-fns/add';
import { Client, Session, WorkoutPlan } from '../types';
import { useNavigate, Link } from 'react-router-dom';

type ViewType = 'day' | 'week' | 'month';

export const Schedule = () => {
  const { sessions, clients, toggleSessionComplete, addSession, addRecurringSessions, updateSessionWithScope, updateSession, workouts } = useStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>('week');
  const [sessionEditorOpen, setSessionEditorOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [preselectedDate, setPreselectedDate] = useState<Date | null>(null);
  const [isOverviewModalOpen, setIsOverviewModalOpen] = useState(false);

  // --- Drag and Drop State ---
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, sessionId: string) => {
    e.dataTransfer.setData('sessionId', sessionId);
    setDraggedItemId(sessionId);
  };

  const handleDrop = (e: React.DragEvent, newDate: Date, isDayView: boolean) => {
    e.preventDefault();
    const sessionId = e.dataTransfer.getData('sessionId');
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      let finalDate = new Date(newDate);
      if (!isDayView) { // For WeekView, preserve original time
        const originalDate = parseISO(session.date);
        finalDate.setHours(originalDate.getHours());
        finalDate.setMinutes(originalDate.getMinutes());
      }
      updateSession(sessionId, { date: finalDate.toISOString() });
    }
    setDraggedItemId(null);
    setDragOverId(null);
  };
  
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };
  const handleDragEnd = () => { setDraggedItemId(null); setDragOverId(null); };

  const handleEditSession = (session: Session) => {
    setEditingSession(session);
    setSessionEditorOpen(true);
  };

  // --- Navigation Logic ---
  const handlePrevious = () => {
    if (view === 'day') setCurrentDate(addDays(currentDate, -1));
    if (view === 'week') setCurrentDate(addWeeks(currentDate, -1));
    if (view === 'month') setCurrentDate(addMonths(currentDate, -1));
  };

  const handleNext = () => {
    if (view === 'day') setCurrentDate(addDays(currentDate, 1));
    if (view === 'week') setCurrentDate(addWeeks(currentDate, 1));
    if (view === 'month') setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => setCurrentDate(new Date());

  const getHeaderText = () => {
    if (view === 'day') return format(currentDate, 'EEEE, MMMM d, yyyy');
    if (view === 'month') return format(currentDate, 'MMMM yyyy');
    
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = addDays(start, 6);
    if (isSameMonth(start, end)) {
        return `${format(start, 'MMMM d')} - ${format(end, 'd, yyyy')}`;
    }
    return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
  };

  // --- Stats Calculation ---
  const { stats, rangeSessions } = useMemo(() => {
    let start: Date, end: Date;
    if (view === 'day') { start = startOfDay(currentDate); end = endOfMonth(addDays(start, 1)); } 
    else if (view === 'month') { start = startOfMonth(currentDate); end = endOfMonth(currentDate); } 
    else { start = startOfWeek(currentDate, { weekStartsOn: 1 }); end = endOfWeek(currentDate, { weekStartsOn: 1 }); }
    const sessionsInRange = sessions.filter(s => { const d = parseISO(s.date); return d >= start && d <= end; });
    const calculatedStats = {
        total: sessionsInRange.length,
        completed: sessionsInRange.filter(s => s.completed).length,
        pending: sessionsInRange.filter(s => !s.completed).length
    };
    return { stats: calculatedStats, rangeSessions: sessionsInRange };
  }, [sessions, currentDate, view]);

  const openQuickAdd = (date: Date) => {
      setPreselectedDate(date);
      setEditingSession(null);
      setSessionEditorOpen(true);
  };

  const dragHandlers = { handleDragStart, handleDrop, handleDragOver, handleDragEnd, setDragOverId, draggedItemId, dragOverId };

  // --- Renderers ---
  const renderView = () => {
    switch (view) {
      case 'day': return <DayView date={currentDate} sessions={sessions} clients={clients} onSessionClick={setSelectedSession} onToggleComplete={toggleSessionComplete} onAreaClick={openQuickAdd} dragHandlers={dragHandlers} />;
      case 'week': return <WeekView date={currentDate} sessions={sessions} clients={clients} onSessionClick={setSelectedSession} onToggleComplete={toggleSessionComplete} onAreaClick={openQuickAdd} dragHandlers={dragHandlers} />;
      case 'month': return <MonthView date={currentDate} sessions={sessions} clients={clients} onDayClick={(d) => { setCurrentDate(d); setView('day'); }} />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-slate-900">Schedule</h1>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full xl:w-auto">
             <div className="flex bg-slate-100 p-1 rounded-lg sm:mr-2 overflow-x-auto">
                 {['day', 'week', 'month'].map(v => (
                     <button key={v} onClick={() => setView(v as ViewType)} className={`flex-1 sm:flex-none px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center justify-center ${view === v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        {v === 'day' && <List className="h-4 w-4 mr-1.5" />}
                        {v === 'week' && <LayoutGrid className="h-4 w-4 mr-1.5" />}
                        {v === 'month' && <CalendarDays className="h-4 w-4 mr-1.5" />}
                        {v.charAt(0).toUpperCase() + v.slice(1)}
                     </button>
                 ))}
             </div>
            <Button onClick={() => { setPreselectedDate(null); setEditingSession(null); setSessionEditorOpen(true); }} className="whitespace-nowrap"><Plus className="mr-2 h-4 w-4" />New Session</Button>
          </div>
        </div>
        <div onClick={() => setIsOverviewModalOpen(true)} className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-4 rounded-xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer hover:shadow-lg transition-shadow">
             <div className="flex items-center gap-2">
                 <div className="p-2 bg-indigo-500/50 rounded-lg"><CalendarIcon className="h-5 w-5 text-white" /></div>
                 <div>
                    <h3 className="font-semibold text-sm opacity-90 capitalize flex items-center gap-1.5">{view}ly Overview <Info className="h-3 w-3 opacity-70"/></h3>
                    <p className="text-xs text-indigo-100">{getHeaderText()}</p>
                 </div>
             </div>
             <div className="flex items-center gap-6 text-sm w-full sm:w-auto justify-between sm:justify-end">
                {Object.entries(stats).map(([key, value]) => (
                   <div key={key} className="flex flex-col items-center sm:items-end">
                     <span className="text-indigo-200 text-xs uppercase tracking-wider font-medium">{key}</span>
                     <span className="font-bold text-xl">{value}</span>
                   </div>
                ))}
             </div>
        </div>
      </div>
      <div className="space-y-4">
           <Card className="p-4 flex items-center justify-between sticky top-0 z-10 shadow-sm border-slate-200">
              <div className="flex items-center gap-2">
                  <button onClick={handlePrevious} className="p-2 hover:bg-slate-100 rounded-full"><ChevronLeft className="h-5 w-5 text-slate-600" /></button>
                  <Button variant="outline" onClick={handleToday} className="hidden sm:flex text-xs h-8">Today</Button>
              </div>
              <div className="text-base sm:text-lg font-bold text-slate-900 truncate max-w-[200px] sm:max-w-none">{getHeaderText()}</div>
              <button onClick={handleNext} className="p-2 hover:bg-slate-100 rounded-full"><ChevronRight className="h-5 w-5 text-slate-600" /></button>
           </Card>
           <div className="animate-in fade-in duration-300">{renderView()}</div>
      </div>
      {sessionEditorOpen && <SessionEditorModal isOpen={sessionEditorOpen} onClose={() => setSessionEditorOpen(false)} onSaveNew={addSession} onSaveRecurring={addRecurringSessions} onUpdate={updateSessionWithScope} sessionToEdit={editingSession} clients={clients} initialDate={preselectedDate || currentDate} />}
      {selectedSession && <SessionDetailsModal session={selectedSession} clients={clients} workouts={workouts} onClose={() => setSelectedSession(null)} onUpdate={updateSession} onEdit={handleEditSession} />}
      {isOverviewModalOpen && <OverviewModal isOpen={isOverviewModalOpen} onClose={() => setIsOverviewModalOpen(false)} sessions={rangeSessions} clients={clients} headerText={`${view.charAt(0).toUpperCase() + view.slice(1)}ly Overview`} workouts={workouts} />}
    </div>
  );
};

// --- View Components ---
const DayView = ({ date, sessions, clients, onSessionClick, onToggleComplete, onAreaClick, dragHandlers }: any) => {
    const { handleDragStart, handleDrop, handleDragOver, handleDragEnd, setDragOverId, draggedItemId, dragOverId } = dragHandlers;
    const hours = Array.from({ length: 17 }, (_, i) => i + 6);
    const daySessions = sessions.filter((s: Session) => isSameDay(parseISO(s.date), date));

    return <div className="space-y-2">{hours.map((hour: number) => {
        const hourIdentifier = `${format(date, 'yyyy-MM-dd')}-${hour}`;
        const targetDate = setHours(startOfDay(date), hour);
        
        return <div key={hour} className="flex gap-4 group"><div className="w-16 sm:w-20 text-right text-sm text-slate-400 pt-3 font-medium shrink-0">{format(setHours(new Date(), hour), 'h:00 a')}</div><div onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, targetDate, true)} onDragEnter={() => setDragOverId(hourIdentifier)} onDragLeave={() => setDragOverId(null)} className={`flex-1 min-h-[80px] border-l-2 pl-4 py-2 relative rounded-r-lg transition-colors ${dragOverId === hourIdentifier ? 'bg-indigo-50 border-indigo-300' : 'border-slate-100'}`}><div className="absolute top-3 left-0 w-full border-t border-slate-100 -z-10"></div>{daySessions.filter((s: Session) => getHours(parseISO(s.date)) === hour).map((session: Session) => <SessionCard key={session.id} session={session} client={clients.find((c: Client) => c.id === session.clientId)} onClick={() => onSessionClick(session)} onToggle={onToggleComplete} onDragStart={handleDragStart} onDragEnd={handleDragEnd} isDragged={draggedItemId === session.id} />)[0] || <div onClick={() => onAreaClick(targetDate)} className="h-full w-full rounded-lg border-2 border-dashed border-transparent hover:border-slate-200 hover:bg-slate-50 transition-all cursor-pointer flex items-center justify-center opacity-0 group-hover:opacity-100"><span className="text-slate-400 text-sm font-medium flex items-center"><Plus className="h-4 w-4 mr-1" /> <span className="hidden sm:inline">Schedule Session</span><span className="sm:hidden">Add</span></span></div>}</div></div>
    })}</div>;
};
const WeekView = ({ date, sessions, clients, onSessionClick, onToggleComplete, onAreaClick, dragHandlers }: any) => {
    const { handleDragStart, handleDrop, handleDragOver, handleDragEnd, setDragOverId, draggedItemId, dragOverId } = dragHandlers;
    const start = startOfWeek(date, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(start, i));
    
    return <div className="space-y-6">{weekDays.map(day => {
        const dayIdentifier = day.toISOString().split('T')[0];
        
        return <div key={day.toISOString()} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, day, false)} onDragEnter={() => setDragOverId(dayIdentifier)} onDragLeave={() => setDragOverId(null)} className={`relative p-2 rounded-xl transition-colors ${isToday(day) ? 'bg-indigo-50/50 -mx-4 px-4 py-2 border border-indigo-100' : ''} ${dragOverId === dayIdentifier ? 'bg-indigo-100' : ''}`}><div className="flex items-start gap-4"><div className="w-14 shrink-0 flex flex-col items-center"><span className="text-sm font-medium text-slate-500 uppercase">{format(day, 'EEE')}</span><span className={`text-xl font-bold mt-1 h-10 w-10 flex items-center justify-center rounded-full ${isToday(day) ? 'bg-indigo-600 text-white' : 'text-slate-900'}`}>{format(day, 'd')}</span></div><div className="flex-1 space-y-3 pt-1">{sessions.filter((s: Session) => isSameDay(parseISO(s.date), day)).length === 0 ? <div onClick={() => onAreaClick(setHours(day, 9))} className="h-12 border border-dashed border-slate-200 rounded-lg flex items-center justify-center text-sm text-slate-400 hover:bg-slate-50 hover:border-indigo-300 hover:text-indigo-500 cursor-pointer transition-colors">No sessions. Click to add.</div> : sessions.filter((s: Session) => isSameDay(parseISO(s.date), day)).sort((a: Session,b: Session) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((session: Session) => <SessionCard key={session.id} session={session} client={clients.find((c: Client) => c.id === session.clientId)} onClick={() => onSessionClick(session)} onToggle={onToggleComplete} onDragStart={handleDragStart} onDragEnd={handleDragEnd} isDragged={draggedItemId === session.id} />)}</div></div></div>
    })}</div>;
};
const MonthView = ({ date, sessions, clients, onDayClick }: any) => {
    const monthStart = startOfMonth(date);
    const calendarDays = eachDayOfInterval({ start: startOfWeek(monthStart, { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(monthStart), { weekStartsOn: 1 }) });
    return <div className="bg-white rounded-lg border border-slate-200 overflow-hidden"><div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => <div key={day} className="py-2 text-center text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">{day}</div>)}</div><div className="grid grid-cols-7 auto-rows-[60px] sm:auto-rows-[100px] divide-x divide-y divide-slate-200">{calendarDays.map(day => <div key={day.toISOString()} onClick={() => onDayClick(day)} className={`p-1 sm:p-2 flex flex-col justify-between hover:bg-slate-50 cursor-pointer transition-colors ${!isSameMonth(day, monthStart) ? 'bg-slate-50/50' : ''}`}><div className="flex justify-between items-start"><span className={`text-[10px] sm:text-sm font-medium h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center rounded-full ${isToday(day) ? 'bg-indigo-600 text-white' : !isSameMonth(day, monthStart) ? 'text-slate-400' : 'text-slate-700'}`}>{format(day, 'd')}</span>{sessions.filter((s: Session) => isSameDay(parseISO(s.date), day)).length > 0 && <span className="hidden sm:inline-block text-[10px] font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full">{sessions.filter((s: Session) => isSameDay(parseISO(s.date), day)).length}</span>}</div><div className="flex sm:hidden flex-wrap gap-0.5 mt-1 content-start h-full">{sessions.filter((s: Session) => isSameDay(parseISO(s.date), day)).map((session: Session) => <div key={session.id} className={`w-1.5 h-1.5 rounded-full ${session.completed ? 'bg-green-500' : 'bg-indigo-500'}`} />)}</div><div className="hidden sm:block space-y-1 mt-1 overflow-hidden">{sessions.filter((s: Session) => isSameDay(parseISO(s.date), day)).slice(0, 3).map((session: Session) => <div key={session.id} className="flex items-center gap-1 text-[10px] truncate"><div className={`w-1.5 h-1.5 rounded-full shrink-0 ${session.completed ? 'bg-green-500' : 'bg-indigo-500'}`}></div><span className={`${!isSameMonth(day, monthStart) ? 'text-slate-400' : 'text-slate-600'}`}>{clients.find((c: Client) => c.id === session.clientId)?.name.split(' ')[0]}</span></div>)}{sessions.filter((s: Session) => isSameDay(parseISO(s.date), day)).length > 3 && <div className="text-[10px] text-slate-400 pl-2.5">+ {sessions.filter((s: Session) => isSameDay(parseISO(s.date), day)).length - 3} more</div>}</div></div>)}</div></div>;
};

// --- Subcomponents ---
const SessionCard = ({ session, client, onClick, onToggle, onDragStart, onDragEnd, isDragged }: any) => {
    return <Card draggable="true" onDragStart={(e) => onDragStart(e, session.id)} onDragEnd={onDragEnd} className={`p-3 sm:p-4 transition-all hover:shadow-md cursor-pointer group ${session.completed ? 'opacity-70 bg-slate-50' : 'bg-white hover:border-indigo-300'} ${isDragged ? 'opacity-50 ring-2 ring-indigo-500' : ''}`} onClick={onClick}><div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"><div className="flex items-start space-x-3 sm:space-x-4"><div className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm whitespace-nowrap font-semibold ${session.category === 'Check-in' ? 'bg-purple-100 text-purple-700' : 'bg-indigo-50 text-indigo-700'}`}>{format(parseISO(session.date), 'h:mm a')}</div><div>{/* FIX: Wrap Repeat icon in a span with a title attribute for tooltip */}
<h4 className="font-semibold text-sm sm:text-base text-slate-900 flex items-center gap-2 group-hover:text-indigo-700">{client?.name || 'Unknown Client'}{session.recurrenceId && <span title="Recurring session"><Repeat className="h-3 w-3 text-slate-400" /></span>}</h4><div className="flex flex-wrap items-center text-xs text-slate-500 mt-1 gap-x-3 gap-y-1"><span className="flex items-center"><Clock className="h-3 w-3 mr-1"/> {session.durationMinutes} min</span><span className="flex items-center">{session.type === 'Online' ? <Video className="h-3 w-3 mr-1"/> : <MapPin className="h-3 w-3 mr-1"/>}{session.type}</span></div></div></div><div className="flex items-center justify-end sm:justify-start space-x-2"><button onClick={(e) => { e.stopPropagation(); onToggle(session.id); }} className={`text-xs px-3 py-1.5 rounded-full border ${session.completed ? 'bg-green-100 text-green-700 border-green-200' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{session.completed ? 'Completed' : 'Mark Complete'}</button></div></div></Card>;
};
const SessionEditorModal = ({ isOpen, onClose, onSaveNew, onSaveRecurring, onUpdate, sessionToEdit, clients, initialDate }: any) => {
    const [formData, setFormData] = useState({ clientId: clients[0]?.id || '', date: format(initialDate, 'yyyy-MM-dd'), time: format(initialDate, 'HH:mm'), durationMinutes: 60, notes: '', linkedWorkoutId: '' });
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurrence, setRecurrence] = useState({ frequency: 'weekly', until: format(add(initialDate, { months: 3 }), 'yyyy-MM-dd') });
    const [isRecurrencePromptOpen, setIsRecurrencePromptOpen] = useState(false);
    const [pendingUpdate, setPendingUpdate] = useState<Partial<Session> | null>(null);

    useEffect(() => { if (sessionToEdit) { const d = parseISO(sessionToEdit.date); setFormData({ clientId: sessionToEdit.clientId, date: format(d, 'yyyy-MM-dd'), time: format(d, 'HH:mm'), durationMinutes: sessionToEdit.durationMinutes, notes: sessionToEdit.notes || '', linkedWorkoutId: sessionToEdit.linkedWorkoutId || '' }); setIsRecurring(!!sessionToEdit.recurrenceId); } }, [sessionToEdit]);
    
    const client = clients.find((c: Client) => c.id === formData.clientId);
    // FIX: Explicitly type constants to ensure correct type inference for baseSession
    const sessionType: 'Online' | 'In-Person' = client?.type === 'Online' ? 'Online' : 'In-Person';
    const sessionCategory: 'Check-in' | 'Workout' = client?.type === 'Online' ? 'Check-in' : 'Workout';
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const combinedDate = new Date(`${formData.date}T${formData.time}`).toISOString();
        const baseSession = { clientId: formData.clientId, date: combinedDate, durationMinutes: Number(formData.durationMinutes), type: sessionType, category: sessionCategory, notes: formData.notes, linkedWorkoutId: formData.linkedWorkoutId };
        
        if (sessionToEdit) { // Editing
            const dateChanged = combinedDate !== sessionToEdit.date;
            if (sessionToEdit.recurrenceId && dateChanged) { setPendingUpdate(baseSession); setIsRecurrencePromptOpen(true); } 
            else { onUpdate(sessionToEdit.id, baseSession, 'single'); onClose(); }
        } else { // Creating
            if (isRecurring) { onSaveRecurring({ ...baseSession }, combinedDate, recurrence.frequency, new Date(`${recurrence.until}T23:59:59`).toISOString()); } 
            else { onSaveNew({ ...baseSession, id: Math.random().toString(36).substr(2, 9), completed: false }); }
            onClose();
        }
    };
    if (!isOpen) return null;
    return <>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"><Card className="w-full max-w-md bg-white shadow-xl animate-in fade-in zoom-in duration-200 overflow-y-auto max-h-[90vh]"><div className="p-6 border-b border-slate-100 sticky top-0 bg-white z-10"><h2 className="text-lg font-bold text-slate-900">{sessionToEdit ? 'Edit Session' : 'New Session'}</h2></div><form onSubmit={handleSubmit} className="p-6 space-y-4"><div className="space-y-2"><Label>Client</Label><Select name="clientId" value={formData.clientId} onChange={handleChange}>{clients.filter((c:Client) => c.status === 'Active').map((c: Client) => <option key={c.id} value={c.id}>{c.name} ({c.type})</option>)}</Select></div><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Date</Label><Input name="date" type="date" required value={formData.date} onChange={handleChange} /></div><div className="space-y-2"><Label>Time</Label><Input name="time" type="time" required value={formData.time} onChange={handleChange} /></div></div><div className="space-y-2"><Label>Duration (minutes)</Label><Select name="durationMinutes" value={formData.durationMinutes} onChange={handleChange}><option value="30">30 min</option><option value="45">45 min</option><option value="60">60 min</option></Select></div>{!sessionToEdit && <div className="space-y-2 pt-2"><label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} className="rounded" /> Make this a recurring session</label></div>}{isRecurring && !sessionToEdit && <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg space-y-3 animate-in fade-in"><div className="space-y-2"><Label>Frequency</Label><Select value={recurrence.frequency} onChange={(e) => setRecurrence(r => ({ ...r, frequency: e.target.value }))}><option value="weekly">Weekly</option><option value="bi-weekly">Bi-weekly</option></Select></div><div className="space-y-2"><Label>Ends on</Label><Input type="date" value={recurrence.until} onChange={(e) => setRecurrence(r => ({ ...r, until: e.target.value }))}/></div></div>}<div className="space-y-2"><Label>Notes</Label><Input name="notes" placeholder="Focus for this session..." value={formData.notes} onChange={handleChange} /></div><div className="flex justify-end space-x-3 pt-4 border-t border-slate-100"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit">Save Session</Button></div></form></Card></div>
        {isRecurrencePromptOpen && <RecurrenceUpdateModal onConfirm={(scope) => { onUpdate(sessionToEdit.id, pendingUpdate, scope); onClose(); }} onCancel={() => setIsRecurrencePromptOpen(false)} />}
    </>;
};
const RecurrenceUpdateModal = ({ onConfirm, onCancel }: any) => {
    return <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"><Card className="w-full max-w-sm p-6 text-center shadow-2xl animate-in zoom-in-90"><div className="mx-auto bg-amber-100 h-12 w-12 rounded-full flex items-center justify-center"><AlertTriangle className="h-6 w-6 text-amber-600" /></div><h3 className="text-lg font-bold mt-4 text-slate-900">Edit Recurring Session</h3><p className="text-sm text-slate-500 mt-2">Do you want to apply this change to only this session, or to this and all future sessions in the series?</p><div className="mt-6 flex flex-col gap-3"><Button onClick={() => onConfirm('future')}>This and future sessions</Button><Button variant="secondary" onClick={() => onConfirm('single')}>Only this session</Button><Button variant="ghost" onClick={onCancel}>Cancel</Button></div></Card></div>;
}
const SessionDetailsModal = ({ session, clients, workouts, onClose, onUpdate, onEdit }: any) => {
  const client = clients.find((c:Client) => c.id === session.clientId);
  const [notes, setNotes] = useState(session.notes || '');
  const [linkedWorkoutId, setLinkedWorkoutId] = useState(session.linkedWorkoutId || '');
  const handleSave = () => { onUpdate(session.id, { notes, linkedWorkoutId: linkedWorkoutId || undefined }); onClose(); };
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"><Card className="w-full max-w-2xl bg-white shadow-xl animate-in fade-in zoom-in duration-200 overflow-hidden flex flex-col max-h-[90vh]"><div className="p-6 border-b border-slate-100 flex justify-between items-start"><div className="flex items-center space-x-4"><div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">{client?.avatar ? <img src={client.avatar} alt={client.name} className="h-full w-full object-cover" /> : <User className="h-6 w-6 text-slate-400" />}</div><div className="min-w-0"><Link to={`/clients/${client?.id}`} className="group flex items-center gap-2"><h2 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-indigo-600 truncate">{client?.name || '...'}</h2><ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600" /></Link><div className="flex flex-wrap items-center text-slate-500 text-sm gap-x-3"><span className="flex items-center"><CalendarIcon className="h-3 w-3 mr-1" /> {format(parseISO(session.date), 'MMM d, yyyy')}</span><span className="flex items-center"><Clock className="h-3 w-3 mr-1" /> {format(parseISO(session.date), 'h:mm a')}</span></div></div></div><button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1"><X className="h-6 w-6" /></button></div><div className="p-6 overflow-y-auto space-y-6"><div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100"><div><span className="text-sm font-medium text-slate-500">Status</span><span className={`font-bold block ${session.completed ? 'text-green-600' : 'text-amber-600'}`}>{session.completed ? 'Completed' : 'Pending'}</span></div><div className="flex gap-2"><Button variant="outline" onClick={() => { onEdit(session); onClose(); }}><Edit2 className="h-4 w-4 mr-2" /> Edit / Reschedule</Button><Button variant={session.completed ? "secondary" : "primary"} onClick={() => onUpdate(session.id, { completed: !session.completed })}>{session.completed ? 'Mark Incomplete' : 'Complete Session'}</Button></div></div><div className="space-y-2"><Label>Session Notes</Label><textarea className="w-full min-h-[100px] p-3 text-sm border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500" placeholder="Record performance..." value={notes} onChange={(e) => setNotes(e.target.value)} /></div>{session.category === 'Workout' && <div className="space-y-3 border-t pt-4"><Label>Training Plan</Label><Select value={linkedWorkoutId} onChange={(e) => setLinkedWorkoutId(e.target.value)}><option value="">-- No specific plan --</option>{workouts.filter((w: WorkoutPlan) => !w.clientId || w.clientId === client?.id).map((w: WorkoutPlan) => <option key={w.id} value={w.id}>{w.title}</option>)}</Select></div>}</div><div className="p-4 border-t bg-slate-50 flex justify-end space-x-3"><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={handleSave}><Save className="h-4 w-4 mr-2" /> Save Details</Button></div></Card></div>;
};

// New Overview Modal Component
const OverviewModal = ({ isOpen, onClose, sessions, clients, headerText, workouts }: any) => {
    const [activeTab, setActiveTab] = useState<'total' | 'completed' | 'pending'>('total');
    const [viewingSession, setViewingSession] = useState<Session | null>(null);

    const filteredSessions = useMemo(() => {
        const sorted = [...sessions].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        if (activeTab === 'completed') return sorted.filter(s => s.completed);
        if (activeTab === 'pending') return sorted.filter(s => !s.completed);
        return sorted;
    }, [sessions, activeTab]);

    useEffect(() => {
      // Reset view when modal is reopened or sessions change
      if (isOpen) setViewingSession(null);
    }, [isOpen, sessions]);

    if (!isOpen) return null;
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <Card className="w-full max-w-3xl bg-white shadow-xl animate-in fade-in zoom-in duration-200 overflow-hidden flex flex-col max-h-[90vh]">
          {!viewingSession ? (
            <>
              <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-900">{headerText}</h2>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1"><X className="h-6 w-6" /></button>
              </div>
              <div className="p-4 border-b border-slate-200 flex space-x-2">
                <button onClick={() => setActiveTab('total')} className={`px-3 py-1 text-sm font-medium rounded-md ${activeTab === 'total' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100'}`}>Total <Badge variant="default" className="ml-1.5 bg-white text-indigo-700">{sessions.length}</Badge></button>
                <button onClick={() => setActiveTab('completed')} className={`px-3 py-1 text-sm font-medium rounded-md ${activeTab === 'completed' ? 'bg-green-600 text-white' : 'hover:bg-slate-100'}`}>Completed <Badge variant="default" className="ml-1.5 bg-white text-green-700">{sessions.filter((s:any)=>s.completed).length}</Badge></button>
                <button onClick={() => setActiveTab('pending')} className={`px-3 py-1 text-sm font-medium rounded-md ${activeTab === 'pending' ? 'bg-amber-600 text-white' : 'hover:bg-slate-100'}`}>Pending <Badge variant="default" className="ml-1.5 bg-white text-amber-700">{sessions.filter((s:any)=>!s.completed).length}</Badge></button>
              </div>
              <div className="overflow-y-auto p-4 space-y-3">
                {filteredSessions.length > 0 ? filteredSessions.map((session: Session) => {
                  const client = clients.find((c: Client) => c.id === session.clientId);
                  return (
                    <div key={session.id} onClick={() => setViewingSession(session)} className="p-3 rounded-lg border border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-50 hover:border-indigo-300">
                       <div className="flex items-center gap-3">
                         <span className={`w-2 h-10 rounded-full ${session.completed ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                         <div>
                            <p className="font-semibold text-slate-800">{client?.name || 'Unknown'}</p>
                            <p className="text-xs text-slate-500">{format(parseISO(session.date), 'MMM d, h:mm a')} • {session.category}</p>
                         </div>
                       </div>
                       <ChevronRight className="h-5 w-5 text-slate-400" />
                    </div>
                  );
                }) : <p className="text-center py-8 text-slate-500">No sessions in this category.</p>}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                <button onClick={() => setViewingSession(null)} className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800"><ChevronLeft className="h-4 w-4 mr-1"/> Back to List</button>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1"><X className="h-6 w-6" /></button>
              </div>
              <div className="overflow-y-auto">
                 <SessionDetailView session={viewingSession} clients={clients} workouts={workouts} />
              </div>
            </div>
          )}
        </Card>
      </div>
    );
};

const SessionDetailView = ({ session, clients, workouts }: any) => {
  const client = clients.find((c:Client) => c.id === session.clientId);
  const workout = workouts.find((w: WorkoutPlan) => w.id === session.linkedWorkoutId);
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center space-x-4">
         <img src={client?.avatar} alt={client?.name} className="h-12 w-12 rounded-full object-cover" />
         <div>
            <h3 className="text-xl font-bold text-slate-900">{client?.name}</h3>
            <div className="flex items-center text-sm text-slate-500 gap-x-3"><span className="flex items-center"><CalendarIcon className="h-3 w-3 mr-1" /> {format(parseISO(session.date), 'EEEE, MMM d, yyyy')}</span><span className="flex items-center"><Clock className="h-3 w-3 mr-1" /> {format(parseISO(session.date), 'h:mm a')}</span></div>
         </div>
      </div>
       <Badge variant={session.completed ? 'success' : 'warning'}>{session.completed ? 'Completed' : 'Pending'}</Badge>
      {session.notes && <div><Label>Session Notes</Label><p className="text-sm p-3 bg-slate-50 rounded-md border border-slate-200 whitespace-pre-wrap">{session.notes}</p></div>}
      {workout && <div><Label>Linked Workout: {workout.title}</Label><div className="p-3 bg-slate-50 rounded-md border border-slate-200 space-y-2 text-sm">{workout.exercises.map((ex: any, i: number) => <div key={i} className="flex justify-between items-center"><span className="text-slate-700">{ex.name}</span><span className="text-slate-500 font-mono text-xs">{ex.sets} x {ex.reps}</span></div>)}</div></div>}
    </div>
  )
}