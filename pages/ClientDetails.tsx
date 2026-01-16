import React, { useState, useMemo } from 'react';
// FIX: Split react-router-dom imports to fix module resolution errors.
import { useParams, useNavigate } from 'react-router';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { Card, Button, Badge, Label, Input, Select } from '../components/ui';
import { ArrowLeft, Calendar, Mail, Phone, HeartPulse, Edit2, Save, FileText, Activity, TrendingUp, AlertCircle, Plus, CheckCircle2, XCircle, Trash2, Dumbbell, ChevronDown, ChevronUp, History, Archive, Flame, DollarSign, Clock, CreditCard, Ruler, Droplets, X } from 'lucide-react';
// FIX: Consolidate date-fns imports to resolve module resolution errors.
import { format, parseISO, isPast } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Evaluation, WorkoutPlan, PaymentStatus, Plan, Skinfolds, Perimeters, Client } from '../types';
import { WorkoutEditorModal } from '../components/WorkoutEditorModal';

const WEEKS_IN_MONTH = 4.33;

// FIX: Changed signature to be more flexible, only requiring properties it uses.
const calculateMonthlyPrice = (plan: Pick<Plan, 'pricePerSession' | 'sessionsPerWeek'>) => {
  return plan.pricePerSession * plan.sessionsPerWeek * WEEKS_IN_MONTH;
};

// --- Chart Configuration ---
const chartableMetrics: Record<string, { label: string; unit: string }> = {
  weight: { label: 'Weight', unit: 'kg' },
  bodyFatPercentage: { label: 'Body Fat', unit: '%' },
  leanMass: { label: 'Lean Mass', unit: 'kg' },
  'perimeters.waist': { label: 'Waist', unit: 'cm' },
  'perimeters.hip': { label: 'Hip', unit: 'cm' },
  'perimeters.chest': { label: 'Chest', unit: 'cm' },
  'skinfolds.triceps': { label: 'Triceps Skinfold', unit: 'mm' },
  'skinfolds.abdominal': { label: 'Abdominal Skinfold', unit: 'mm' },
};

export const ClientDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { clients, sessions, evaluations, workouts, finances, plans, updateClient, addEvaluation, addWorkout, updateWorkout, deleteWorkout } = useStore();
  
  const [activeTab, setActiveTab] = useState<'history' | 'evaluations' | 'workouts'>('history');
  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<WorkoutPlan | null>(null);
  
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesBuffer, setNotesBuffer] = useState('');
  
  const [selectedMetric, setSelectedMetric] = useState<string>('weight');

  const client = clients.find(c => c.id === id);
  const clientPlan = plans.find(p => p.id === client?.planId);

  const financialStatus = useMemo(() => {
     if (!client) return null;
     if (!client.planId) return { status: 'No Plan', color: 'text-slate-500', icon: AlertCircle, bg: 'bg-slate-100' };

     const currentMonthStr = new Date().toISOString().slice(0, 7);
     
     const monthlyInvoice = finances.find(f => 
         f.clientId === client.id && 
         f.date.startsWith(currentMonthStr) &&
         f.type === 'Subscription'
     );

     if (!monthlyInvoice) return { status: 'No Invoice', color: 'text-amber-600', icon: AlertCircle, bg: 'bg-amber-100' };
     if (monthlyInvoice.status === PaymentStatus.Paid) return { status: 'Paid', color: 'text-green-600', icon: CheckCircle2, bg: 'bg-green-100' };
     if (monthlyInvoice.status === PaymentStatus.Overdue) return { status: 'Overdue', color: 'text-red-600', icon: AlertCircle, bg: 'bg-red-100' };
     return { status: 'Pending', color: 'text-amber-600', icon: Clock, bg: 'bg-amber-100' };

  }, [client, finances]);

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <h2 className="text-xl font-semibold text-slate-900">Client not found</h2>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/clients')}>
          Back to Clients
        </Button>
      </div>
    );
  }

  // --- Derived Data ---
  const clientSessions = sessions
    .filter(s => s.clientId === client.id && isPast(parseISO(s.date)))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const clientEvaluations = evaluations
    .filter(e => e.clientId === client.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const chartData = useMemo(() => {
    const getMetricValue = (evaluation: Evaluation, metricKey: string): number | undefined => {
        const keys = metricKey.split('.');
        let value: any = evaluation;
        for (const key of keys) {
            if (value === undefined || value === null) return undefined;
            value = value[key];
        }
        return typeof value === 'number' ? value : undefined;
    };

    return clientEvaluations
        .map(e => ({
            date: format(parseISO(e.date), 'MMM d'),
            value: getMetricValue(e, selectedMetric)
        }))
        .filter(d => d.value !== undefined)
        .reverse();
  }, [clientEvaluations, selectedMetric]);

  const clientWorkouts = workouts.filter(w => w.clientId === client.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const activePlans = clientWorkouts.filter(w => w.status === 'Active' || !w.status);
  const archivedPlans = clientWorkouts.filter(w => w.status === 'Archived');

  const handleSaveNotes = () => { updateClient(client.id, { notes: notesBuffer }); setIsEditingNotes(false); };
  const handleStartEditNotes = () => { setNotesBuffer(client.notes || ''); setIsEditingNotes(true); };
  const handleDeleteWorkout = (workoutId: string) => { if (window.confirm("Delete this workout prescription?")) deleteWorkout(workoutId); };
  const handleArchiveWorkout = (workoutId: string) => updateWorkout(workoutId, { status: 'Archived' });
  const handleActivateWorkout = (workoutId: string) => updateWorkout(workoutId, { status: 'Active' });
  const handleEditWorkout = (workout: WorkoutPlan) => { setEditingWorkout(workout); setIsWorkoutModalOpen(true); };
  const handleSaveWorkout = (workout: WorkoutPlan) => { if (editingWorkout) updateWorkout(workout.id, workout); else addWorkout(workout); setIsWorkoutModalOpen(false); };
  
  const age = client.dateOfBirth ? new Date().getFullYear() - new Date(client.dateOfBirth).getFullYear() : 'N/A';

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate('/clients')} className="pl-0 text-slate-500 hover:text-slate-900"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Clients</Button>
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 items-start">
        <img src={client.avatar} alt={client.name} className="h-24 w-24 rounded-full object-cover border-4 border-slate-50" />
        <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2">
                    <div className="flex flex-col md:flex-row md:items-center gap-2">
                        <h1 className="text-3xl font-bold text-slate-900">{client.name}</h1>
                        <Badge variant={client.status === 'Active' ? 'success' : 'default'} className="w-fit">{client.status}</Badge>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-x-4 gap-y-1 text-slate-500 text-sm">
                        <span className="flex items-center"><Mail className="h-4 w-4 mr-2" />{client.email}</span>
                        <span className="flex items-center"><Phone className="h-4 w-4 mr-2" />{client.phone}</span>
                        <span className="flex items-center"><Calendar className="h-4 w-4 mr-2" />{age} years old</span>
                    </div>
                </div>
                <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
                    {financialStatus && ( <button onClick={() => navigate(`/finances?clientId=${client.id}`)} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-transform hover:scale-105 ${financialStatus.bg} ${financialStatus.color}`} title="Click to view payment history"><financialStatus.icon className="h-4 w-4" /><span>{financialStatus.status} Month</span><CreditCard className="h-3 w-3 ml-1 opacity-50" /></button>)}
                    {clientPlan && (
                        <Link to={`/finances?clientId=${client.id}`} className="flex items-center font-medium text-indigo-600 hover:text-indigo-800 text-sm" title="View financial history for this plan">
                            <DollarSign className="h-4 w-4 mr-1" />{clientPlan.name} (${calculateMonthlyPrice(clientPlan).toFixed(2)})
                        </Link>
                    )}
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
           <Card className="p-6">
               <h3 className="font-semibold text-slate-900 mb-4 flex items-center"><HeartPulse className="h-5 w-5 mr-2 text-indigo-600" />Medical History</h3>
               <div className="space-y-2 text-sm">
                   <div className="flex justify-between"><span className="text-slate-500">Main Goal:</span> <span className="font-medium text-slate-800">{client.medicalHistory?.objective?.join(', ') || client.goal}</span></div>
                   <div className="flex justify-between"><span className="text-slate-500">Injuries:</span> <span className="font-medium text-slate-800">{client.medicalHistory?.injuries || 'None'}</span></div>
                   <div className="flex justify-between"><span className="text-slate-500">Surgeries:</span> <span className="font-medium text-slate-800">{client.medicalHistory?.surgeries || 'None'}</span></div>
                   <div className="flex justify-between"><span className="text-slate-500">Medications:</span> <span className="font-medium text-slate-800">{client.medicalHistory?.medications || 'None'}</span></div>
               </div>
           </Card>
           <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
               <h3 className="font-semibold text-slate-900 flex items-center"><FileText className="h-5 w-5 mr-2 text-indigo-600" />Notes & Limitations</h3>
               {!isEditingNotes ? ( <button onClick={handleStartEditNotes} className="text-slate-400 hover:text-indigo-600"><Edit2 className="h-4 w-4" /></button> ) : ( <button onClick={handleSaveNotes} className="text-green-600 hover:text-green-700"><Save className="h-4 w-4" /></button> )}
            </div>
            {isEditingNotes ? ( <textarea className="w-full h-32 p-3 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none" value={notesBuffer} onChange={(e) => setNotesBuffer(e.target.value)} /> ) : ( <div className="bg-yellow-50 text-yellow-900 p-4 rounded-lg text-sm leading-relaxed whitespace-pre-wrap">{client.notes || "No notes available."}</div> )}
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="flex border-b border-slate-200 space-x-6"><button onClick={() => setActiveTab('history')} className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'history' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Session History</button><button onClick={() => setActiveTab('evaluations')} className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'evaluations' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Evaluations</button><button onClick={() => setActiveTab('workouts')} className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'workouts' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Prescriptions</button></div>
          {activeTab === 'history' && ( <div className="space-y-4">{clientSessions.length > 0 ? (clientSessions.map(session => ( <Card key={session.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"><div className="flex items-start gap-3"><div className={`mt-1 p-2 rounded-full ${session.completed ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>{session.completed ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}</div><div><div className="font-semibold text-slate-900">{format(parseISO(session.date), 'EEEE, MMMM d, yyyy')}</div><div className="text-sm text-slate-500 mt-0.5">{format(parseISO(session.date), 'h:mm a')} • {session.durationMinutes} min • {session.type}</div>{session.notes && <div className="mt-2 text-sm bg-slate-50 p-2 rounded text-slate-600">"{session.notes}"</div>}</div></div></Card> ))) : ( <div className="text-center py-12 text-slate-500">No session history available.</div> )}</div> )}
          {activeTab === 'evaluations' && ( <div className="space-y-6"><div className="flex justify-between items-center"><h3 className="text-lg font-semibold text-slate-900">Progress Tracking</h3><Button onClick={() => setIsEvalModalOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Evaluation</Button></div>{clientEvaluations.length > 0 ? ( <> <Card className="p-6"><div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4"><h4 className="text-sm font-medium text-slate-500 whitespace-nowrap">{chartableMetrics[selectedMetric].label} Progression ({chartableMetrics[selectedMetric].unit})</h4><div className="w-full sm:w-56"><Label htmlFor="metric-select" className="sr-only">Select Metric</Label><Select id="metric-select" value={selectedMetric} onChange={(e) => setSelectedMetric(e.target.value)}>{Object.entries(chartableMetrics).map(([key, { label, unit }]) => (<option key={key} value={key}>{label} ({unit})</option>))}</Select></div></div><div className="h-[250px] w-full"><ResponsiveContainer width="100%" height="100%">{chartData.length > 1 ? <LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} /><YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} domain={['auto', 'auto']} /><Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} /><Line type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={3} dot={{r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} /></LineChart> : <div className="flex items-center justify-center h-full text-slate-500">Not enough data to display a trend for this metric.</div>}</ResponsiveContainer></div></Card><div className="space-y-4">{clientEvaluations.map(ev => <EvaluationCard key={ev.id} evaluation={ev} />)}</div></> ) : ( <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-200"><Activity className="h-12 w-12 text-slate-300 mx-auto mb-3" /><h3 className="text-lg font-medium text-slate-900">No evaluations yet</h3><Button onClick={() => setIsEvalModalOpen(true)}>Add First Evaluation</Button></div> )}</div> )}
          {activeTab === 'workouts' && ( <div className="space-y-8"><div className="flex justify-between items-center"><h3 className="text-lg font-semibold text-slate-900">Workout Plans</h3><Button onClick={() => { setEditingWorkout(null); setIsWorkoutModalOpen(true); }}><Plus className="mr-2 h-4 w-4" /> Create Workout</Button></div><div className="space-y-4"><h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider flex items-center"><Dumbbell className="h-4 w-4 mr-2" /> Active Prescriptions</h4>{activePlans.length > 0 ? activePlans.map(workout => ( <WorkoutCard key={workout.id} workout={workout} onDelete={handleDeleteWorkout} onArchive={handleArchiveWorkout} onEdit={handleEditWorkout} isActive={true} /> )) : <div className="p-8 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-center text-slate-500">No active workout plans assigned.</div>}</div><div className="space-y-4 pt-4 border-t border-slate-200"><h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider flex items-center"><History className="h-4 w-4 mr-2" /> Plan History</h4>{archivedPlans.length > 0 ? archivedPlans.map(workout => ( <WorkoutCard key={workout.id} workout={workout} onDelete={handleDeleteWorkout} onActivate={handleActivateWorkout} onEdit={handleEditWorkout} isActive={false} /> )) : <div className="p-4 text-center text-sm text-slate-400 italic">No archived plans.</div>}</div></div> )}
        </div>
      </div>
      {isEvalModalOpen && <EvaluationModal clientId={client.id} onClose={() => setIsEvalModalOpen(false)} onSave={addEvaluation} />}
      {isWorkoutModalOpen && <WorkoutEditorModal client={client} initialData={editingWorkout} isOpen={isWorkoutModalOpen} onClose={() => setIsWorkoutModalOpen(false)} onSave={handleSaveWorkout} />}
    </div>
  );
};

interface EvaluationCardProps {
  evaluation: Evaluation;
}
const EvaluationCard: React.FC<EvaluationCardProps> = ({ evaluation }) => {
    const [expanded, setExpanded] = useState(false);
    return (
        <Card className="overflow-hidden">
            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50" onClick={() => setExpanded(!expanded)}>
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><Activity className="h-5 w-5" /></div>
                    <div>
                        <div className="font-bold text-slate-900">Evaluation - {format(parseISO(evaluation.date), 'MMMM d, yyyy')}</div>
                        <div className="text-xs text-slate-500">{evaluation.notes}</div>
                    </div>
                </div>
                <div className="flex items-center gap-4 text-sm shrink-0">
                    <div className="text-center"><div className="font-bold text-slate-800">{evaluation.weight}kg</div><div className="text-xs text-slate-500">Weight</div></div>
                    <div className="text-center"><div className="font-bold text-slate-800">{evaluation.bodyFatPercentage || '-'}%</div><div className="text-xs text-slate-500">Body Fat</div></div>
                    <button className="p-2 text-slate-400 hover:text-indigo-600"><ChevronDown className={`h-5 w-5 transition-transform ${expanded ? 'rotate-180' : ''}`} /></button>
                </div>
            </div>
            {expanded && (
                <div className="p-6 bg-slate-50/50 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 animate-in fade-in">
                    <div>
                        <h4 className="font-semibold text-slate-800 mb-3 flex items-center"><Ruler className="h-4 w-4 mr-2 text-slate-500" />Perimeters (cm)</h4>
                        <dl className="text-sm space-y-2">{Object.entries(evaluation.perimeters || {}).map(([key, value]) => <div key={key} className="flex justify-between border-b border-slate-200 pb-1"><dt className="text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</dt><dd className="font-medium text-slate-900">{value}</dd></div>)}</dl>
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-800 mb-3 flex items-center"><Droplets className="h-4 w-4 mr-2 text-slate-500" />Skinfolds (mm)</h4>
                        <dl className="text-sm space-y-2">{Object.entries(evaluation.skinfolds || {}).map(([key, value]) => <div key={key} className="flex justify-between border-b border-slate-200 pb-1"><dt className="text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</dt><dd className="font-medium text-slate-900">{value}</dd></div>)}</dl>
                    </div>
                </div>
            )}
        </Card>
    );
};

const WorkoutCard: React.FC<{ workout: WorkoutPlan; onDelete: (id: string) => void; onArchive?: (id: string) => void; onActivate?: (id: string) => void; onEdit: (w: WorkoutPlan) => void; isActive: boolean; }> = ({ workout, onDelete, onArchive, onActivate, onEdit, isActive }) => {
  const [expanded, setExpanded] = useState(false);
  return ( <Card className={`overflow-hidden transition-all ${!isActive ? 'bg-slate-50 opacity-75 hover:opacity-100' : 'bg-white'}`}><div className="p-5"><div className="flex justify-between items-start"><div><div className="flex items-center gap-2 mb-1"><h4 className="font-bold text-slate-900 text-lg">{workout.title}</h4>{!isActive && <Badge variant="default" className="text-xs">Archived</Badge>}</div><p className="text-slate-500 text-sm">{workout.description}</p><div className="flex gap-2 mt-2">{workout.tags.map(tag => <span key={tag} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">#{tag}</span>)}<span className="text-xs text-slate-400 flex items-center ml-2"><Calendar className="h-3 w-3 mr-1" /> {format(parseISO(workout.createdAt), 'MMM d, yyyy')}</span></div></div><div className="flex items-center gap-2"><Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-600" title="Edit Plan" onClick={() => onEdit(workout)}><Edit2 className="h-4 w-4" /></Button>{isActive && onArchive && <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-amber-600" title="Archive Plan" onClick={() => onArchive(workout.id)}><Archive className="h-4 w-4" /></Button>}{!isActive && onActivate && <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-green-600" title="Reactivate Plan" onClick={() => onActivate(workout.id)}><CheckCircle2 className="h-4 w-4" /></Button>}<Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-red-600" title="Delete Plan" onClick={() => onDelete(workout.id)}><Trash2 className="h-4 w-4" /></Button></div></div><button onClick={() => setExpanded(!expanded)} className="w-full mt-4 flex items-center justify-center py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded transition-colors">{expanded ? <>Hide Items <ChevronUp className="ml-1 h-3 w-3" /></> : <>View {workout.exercises.length} Items <ChevronDown className="ml-1 h-3 w-3" /></>}</button></div>{expanded && <div className="bg-slate-50/50 border-t border-slate-100 px-5 py-3 text-sm"><ul className="space-y-3">{workout.exercises.map((ex, idx) => <li key={idx} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 last:border-0 last:pb-0 ${ex.isWarmup ? 'bg-orange-50/50 -mx-2 px-2 rounded' : ''}`}><div className="flex-1"><div className="flex items-center gap-2">{ex.isWarmup && <Flame className="h-3 w-3 text-orange-500 flex-shrink-0" />}<span className={`font-medium ${ex.isWarmup ? 'text-orange-800' : 'text-slate-700'}`}>{ex.name}</span></div></div><div className="flex items-center gap-4 text-slate-500 text-xs sm:text-sm"><span className="bg-white px-2 py-0.5 rounded border border-slate-200 shadow-sm whitespace-nowrap">{ex.sets} x {ex.reps}</span>{ex.notes && <span className="text-slate-400 italic max-w-[150px] truncate" title={ex.notes}>{ex.notes}</span>}</div></li>)}</ul></div>}</Card> );
};

const initialEvalState: Omit<Evaluation, 'id' | 'clientId' | 'date'> = { weight: 0, height: 0, bodyFatPercentage: 0, leanMass: 0, notes: '', perimeters: {}, skinfolds: {} };
const EvaluationModal = ({ clientId, onClose, onSave, initialData }: { clientId: string; onClose: () => void; onSave: (e: Omit<Evaluation, 'id'>) => void; initialData?: Evaluation | null }) => {
    const [data, setData] = useState(initialData || initialEvalState);
    const [tab, setTab] = useState('vitals');
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); const newEval: Omit<Evaluation, 'id'> = { ...data, clientId, date: initialData?.date || new Date().toISOString() }; onSave(newEval); onClose(); };
    const handleNumericChange = (key: keyof Evaluation, value: string) => setData(d => ({...d, [key]: value === '' ? undefined : parseFloat(value)}));
    const handleNestedChange = (category: 'perimeters' | 'skinfolds', key: string, value: string) => setData(d => ({...d, [category]: {...d[category], [key]: value === '' ? undefined : parseFloat(value)}}));

    const perimeterFields: (keyof Perimeters)[] = ['relaxedArm', 'flexedArm', 'forearm', 'chest', 'waist', 'abdomen', 'hip', 'thigh', 'calf'];
    const skinfoldFields: (keyof Skinfolds)[] = ['triceps', 'biceps', 'subscapular', 'pectoral', 'suprailiac', 'axillary', 'abdominal', 'thigh', 'calf', 'supraSpinal'];
    
    return ( <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"><Card className="w-full max-w-2xl bg-white shadow-xl max-h-[90vh] flex flex-col"><div className="p-4 border-b border-slate-100 flex justify-between items-center"><h3 className="font-bold text-slate-900">Add Evaluation</h3><button onClick={onClose}><X className="h-5 w-5"/></button></div><div className="border-b border-slate-200 px-4 flex items-center gap-4"><button onClick={()=>setTab('vitals')} className={`py-3 text-sm font-medium ${tab==='vitals' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}>Vitals</button><button onClick={()=>setTab('perimeters')} className={`py-3 text-sm font-medium ${tab==='perimeters' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}>Perimeters</button><button onClick={()=>setTab('skinfolds')} className={`py-3 text-sm font-medium ${tab==='skinfolds' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}>Skinfolds</button></div><form onSubmit={handleSubmit} className="overflow-y-auto"><div className="p-6 space-y-4">{tab === 'vitals' && <> <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Weight (kg)</Label><Input type="number" step="0.1" value={data.weight || ''} onChange={e => handleNumericChange('weight', e.target.value)} required /></div><div className="space-y-2"><Label>Height (m)</Label><Input type="number" step="0.01" value={data.height || ''} onChange={e => handleNumericChange('height', e.target.value)} /></div><div className="space-y-2"><Label>Body Fat (%)</Label><Input type="number" step="0.1" value={data.bodyFatPercentage || ''} onChange={e => handleNumericChange('bodyFatPercentage', e.target.value)} /></div><div className="space-y-2"><Label>Lean Mass (kg)</Label><Input type="number" step="0.1" value={data.leanMass || ''} onChange={e => handleNumericChange('leanMass', e.target.value)} /></div></div><div className="space-y-2"><Label>Notes</Label><Input value={data.notes || ''} onChange={e => setData(d => ({ ...d, notes: e.target.value }))} /></div></>} {tab === 'perimeters' && <div className="grid grid-cols-2 md:grid-cols-3 gap-4">{perimeterFields.map(key => <div key={key} className="space-y-2"><Label className="capitalize text-slate-600">{key.replace(/([A-Z])/g, ' $1')}</Label><Input type="number" step="0.1" value={data.perimeters?.[key] || ''} onChange={e => handleNestedChange('perimeters', key, e.target.value)} /></div>)}</div>} {tab === 'skinfolds' && <div className="grid grid-cols-2 md:grid-cols-3 gap-4">{skinfoldFields.map(key => <div key={key} className="space-y-2"><Label className="capitalize text-slate-600">{key.replace(/([A-Z])/g, ' $1')}</Label><Input type="number" step="0.1" value={data.skinfolds?.[key] || ''} onChange={e => handleNestedChange('skinfolds', key, e.target.value)} /></div>)}</div>}</div><div className="flex justify-end space-x-3 p-4 border-t border-slate-100 bg-slate-50"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit">Save Evaluation</Button></div></form></Card></div> );
};