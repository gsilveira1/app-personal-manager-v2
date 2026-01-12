import { create } from 'zustand';
import { Client, ClientStatus, Session, WorkoutPlan, FinanceRecord, PaymentStatus, PaymentMethod, Evaluation, Plan, Product } from './types';
// FIX: Use ESM submodule imports for date-fns to ensure correct module resolution and prevent "not callable" errors.
import addDays from 'date-fns/addDays';
import subDays from 'date-fns/subDays';
import parseISO from 'date-fns/parseISO';
import subMonths from 'date-fns/subMonths';

const WEEKS_IN_MONTH = 4.33;

interface AppState {
  clients: Client[];
  sessions: Session[];
  workouts: WorkoutPlan[];
  finances: FinanceRecord[];
  evaluations: Evaluation[];
  plans: Plan[];
  products: Product[];
  aiPromptInstructions: string;
  
  addClient: (client: Client) => void;
  updateClient: (id: string, client: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  
  addSession: (session: Session) => void;
  addRecurringSessions: (baseSession: Omit<Session, 'id' | 'date' | 'completed'>, startDateStr: string, frequency: 'weekly' | 'bi-weekly', untilDateStr: string) => void;
  updateSession: (id: string, session: Partial<Session>) => void;
  updateSessionWithScope: (sessionId: string, updates: Partial<Session>, scope: 'single' | 'future') => void;
  toggleSessionComplete: (id: string) => void;
  
  addWorkout: (workout: WorkoutPlan) => void;
  updateWorkout: (id: string, workout: Partial<WorkoutPlan>) => void;
  deleteWorkout: (id: string) => void;
  
  addFinanceRecord: (record: FinanceRecord) => void;
  generateMonthlyInvoices: () => void;
  markFinanceRecordPaid: (id: string, method: PaymentMethod) => void;
  
  addEvaluation: (evaluation: Evaluation) => void;

  addPlan: (plan: Plan) => void;
  updatePlan: (id: string, plan: Partial<Plan>) => void;
  deletePlan: (id: string) => void;

  updateAiPromptInstructions: (instructions: string) => void;
}

// --- MOCK DATA ---

const MOCK_PLANS: Plan[] = [
  { id: 'p1', name: 'Starter Hybrid', sessionsPerWeek: 2, sessionDurationMinutes: 60, pricePerSession: 40 },
  { id: 'p2', name: 'Pro Hybrid', sessionsPerWeek: 3, sessionDurationMinutes: 60, pricePerSession: 35 },
  { id: 'p3', name: 'Basic Online', sessionsPerWeek: 1, sessionDurationMinutes: 30, pricePerSession: 20 },
  { id: 'p4', name: 'Elite Athlete', sessionsPerWeek: 5, sessionDurationMinutes: 90, pricePerSession: 50 },
];

const MOCK_PRODUCTS: Product[] = [
  { id: 'prod1', name: 'Single Evaluation', price: 50, category: 'Evaluation' },
  { id: 'prod2', name: 'Marathon 12-Week PDF', price: 40, category: 'Workout Template' },
  { id: 'prod3', name: 'Nutrition Consultation', price: 75, category: 'Other' },
  { id: 'prod4', name: 'Advanced Kettlebell Guide', price: 25, category: 'Digital Product' },
];

const MOCK_CLIENTS: Client[] = [
  { 
    id: '1', name: 'Alice Freeman', email: 'alice@example.com', phone: '555-0101', 
    status: ClientStatus.Active, type: 'In-Person', goal: 'Marathon Prep', 
    avatar: 'https://i.pravatar.cc/150?img=1', 
    notes: 'Prefers morning sessions. Avoids high-impact plyometrics due to past knee issues.', 
    planId: 'p1',
    dateOfBirth: '1988-07-15',
    medicalHistory: {
      objective: ['Performance', 'Health'],
      injuries: 'Right knee sensitivity.',
      surgeries: 'None.',
      medications: 'Occasional ibuprofen.',
      hasHeartDisease: false,
      smoker: false,
      drinker: true,
    }
  },
  { 
    id: '2', name: 'Bob Smith', email: 'bob@example.com', phone: '555-0102', 
    status: ClientStatus.Active, type: 'Online', checkInFrequency: 'Weekly', goal: 'Hypertrophy', 
    avatar: 'https://i.pravatar.cc/150?img=2', 
    planId: 'p3', dateOfBirth: '1992-03-22',
    medicalHistory: { objective: ['Aesthetics'] }
  },
  { 
    id: '3', name: 'Charlie Davis', email: 'charlie@example.com', phone: '555-0103', 
    status: ClientStatus.Inactive, type: 'In-Person', goal: 'Weight Loss', 
    avatar: 'https://i.pravatar.cc/150?img=3', 
    planId: 'p2', dateOfBirth: '1985-11-10',
    notes: 'Paused membership due to work travel.'
  },
  {
    id: '4', name: 'Diana Prince', email: 'diana@example.com', phone: '555-0104',
    status: ClientStatus.Active, type: 'In-Person', goal: 'Functional Strength',
    avatar: 'https://i.pravatar.cc/150?img=4',
    planId: 'p4', dateOfBirth: '1995-01-20',
    medicalHistory: { objective: ['Strength', 'Health'], surgeries: 'Shoulder surgery (2020)', injuries: 'Be cautious with overhead presses.' }
  },
  {
    id: '5', name: 'Ethan Hunt', email: 'ethan@example.com', phone: '555-0105',
    status: ClientStatus.Lead, type: 'Online', goal: 'General Fitness',
    avatar: 'https://i.pravatar.cc/150?img=5',
    dateOfBirth: '1990-09-05',
    notes: 'Contacted via website. Follow up next week.'
  }
];

const MOCK_WORKOUTS: WorkoutPlan[] = [
  { 
    id: 'w1', title: 'Full Body Power', description: 'Heavy compound movement routine.', 
    tags: ['Strength', 'Intermediate'], createdAt: subDays(new Date(), 30).toISOString(),
    exercises: [
      { name: 'Deadlift', sets: 3, reps: '5', notes: 'Keep back straight' },
      { name: 'Bench Press', sets: 4, reps: '8', notes: 'Explosive up' },
      { name: 'Pull-ups', sets: 4, reps: 'AMRAP', notes: 'As many reps as possible' },
    ]
  },
  { 
    id: 'w2', clientId: '1', status: 'Active', title: 'Marathon Leg Prep', 
    description: 'High volume legs for endurance.', tags: ['Endurance', 'Legs'],
    createdAt: subDays(new Date(), 5).toISOString(),
    exercises: [
      { name: 'Barbell Squats', sets: 5, reps: '5' },
      { name: 'Walking Lunges', sets: 3, reps: '20 per leg' },
      { name: 'Calf Raises', sets: 4, reps: '15', notes: 'Slow eccentric' },
    ]
  },
  {
    id: 'w3', clientId: '4', status: 'Active', title: 'Functional Strength Day A',
    description: 'Focus on push movements and core stability.', tags: ['Functional', 'Push'],
    createdAt: subDays(new Date(), 10).toISOString(),
    exercises: [
      { name: 'Treadmill Jog', sets: 1, reps: '5 min', isWarmup: true },
      { name: 'Dynamic Stretches', sets: 1, reps: '5 min', isWarmup: true },
      { name: 'Overhead Press (Dumbbell)', sets: 4, reps: '10', notes: 'Use lighter weight, focus on form.' },
      { name: 'Push-ups', sets: 3, reps: '15' },
      { name: 'Plank', sets: 3, reps: '60s hold' },
    ]
  },
  {
    id: 'w4', clientId: '4', status: 'Archived', title: 'Old Shoulder Rehab',
    description: 'Initial post-surgery routine.', tags: ['Rehab', 'Beginner'],
    createdAt: subMonths(new Date(), 6).toISOString(),
    exercises: [{ name: 'Banded External Rotation', sets: 3, reps: '15' }]
  },
   { 
    id: 'w5', title: 'At-Home HIIT', description: 'No equipment, high-intensity workout.', 
    tags: ['HIIT', 'Bodyweight', '30min'], createdAt: subDays(new Date(), 90).toISOString(),
    exercises: [
      { name: 'Jumping Jacks', sets: 1, reps: '60s', isWarmup: true },
      { name: 'High Knees', sets: 3, reps: '45s on, 15s off' },
      { name: 'Burpees', sets: 3, reps: '45s on, 15s off' },
      { name: 'Mountain Climbers', sets: 3, reps: '45s on, 15s off' },
    ]
  }
];

const recIdBob = 'rec-bob-weekly';
const recIdDiana = 'rec-diana-biweekly';
const MOCK_SESSIONS: Session[] = [
  // Alice
  { id: 's1', clientId: '1', date: addDays(new Date(), 1).toISOString(), durationMinutes: 60, type: 'In-Person', category: 'Workout', completed: false, linkedWorkoutId: 'w2' },
  { id: 's3', clientId: '1', date: subDays(new Date(), 2).toISOString(), durationMinutes: 60, type: 'In-Person', category: 'Workout', completed: true, notes: 'Felt strong today, increased squat weight.' },
  { id: 's4', clientId: '1', date: subDays(new Date(), 5).toISOString(), durationMinutes: 60, type: 'In-Person', category: 'Workout', completed: true },
  { id: 's5', clientId: '1', date: subDays(new Date(), 10).toISOString(), durationMinutes: 60, type: 'In-Person', category: 'Workout', completed: false }, // Missed
  // Bob (Recurring)
  { id: 's2', clientId: '2', date: addDays(new Date(), 2).toISOString(), durationMinutes: 30, type: 'Online', category: 'Check-in', completed: false, recurrenceId: recIdBob },
  { id: 's6', clientId: '2', date: addDays(new Date(), 9).toISOString(), durationMinutes: 30, type: 'Online', category: 'Check-in', completed: false, recurrenceId: recIdBob },
  { id: 's7', clientId: '2', date: addDays(new Date(), 16).toISOString(), durationMinutes: 30, type: 'Online', category: 'Check-in', completed: false, recurrenceId: recIdBob },
  // Diana
  { id: 's8', clientId: '4', date: new Date().toISOString(), durationMinutes: 90, type: 'In-Person', category: 'Workout', completed: false, linkedWorkoutId: 'w3', recurrenceId: recIdDiana },
  { id: 's9', clientId: '4', date: addDays(new Date(), 14).toISOString(), durationMinutes: 90, type: 'In-Person', category: 'Workout', completed: false, linkedWorkoutId: 'w3', recurrenceId: recIdDiana },
  // Charlie (Inactive)
  { id: 's10', clientId: '3', date: subMonths(new Date(), 2).toISOString(), durationMinutes: 60, type: 'In-Person', category: 'Workout', completed: true },
];

const MOCK_FINANCES: FinanceRecord[] = [
  // Current Month
  { id: 'f1', clientId: '1', amount: 346.40, date: subDays(new Date(), 5).toISOString(), status: PaymentStatus.Paid, method: PaymentMethod.Pix, description: 'Plan: Starter Hybrid', type: 'Subscription', relatedId: 'p1' },
  { id: 'f2', clientId: '2', amount: 86.60, date: subDays(new Date(), 2).toISOString(), status: PaymentStatus.Paid, method: PaymentMethod.CreditCard, description: 'Plan: Basic Online', type: 'Subscription', relatedId: 'p3' },
  { id: 'f10', clientId: '4', amount: 1082.5, date: subDays(new Date(), 1).toISOString(), status: PaymentStatus.Pending, method: PaymentMethod.Transfer, description: 'Plan: Elite Athlete', type: 'Subscription', relatedId: 'p4'},
  
  // Last Month
  { id: 'f4', clientId: '1', amount: 346.40, date: subMonths(subDays(new Date(), 5), 1).toISOString(), status: PaymentStatus.Paid, method: PaymentMethod.Pix, description: 'Plan: Starter Hybrid', type: 'Subscription', relatedId: 'p1' },
  { id: 'f5', clientId: '2', amount: 86.60, date: subMonths(subDays(new Date(), 2), 1).toISOString(), status: PaymentStatus.Paid, method: PaymentMethod.CreditCard, description: 'Plan: Basic Online', type: 'Subscription', relatedId: 'p3' },
  { id: 'f6', clientId: '3', amount: 454.65, date: subMonths(subDays(new Date(), 15), 1).toISOString(), status: PaymentStatus.Overdue, method: PaymentMethod.Pix, description: 'Plan: Pro Hybrid', type: 'Subscription', relatedId: 'p2' },
  { id: 'f11', clientId: '4', amount: 1082.5, date: subMonths(subDays(new Date(), 1), 1).toISOString(), status: PaymentStatus.Paid, method: PaymentMethod.Transfer, description: 'Plan: Elite Athlete', type: 'Subscription', relatedId: 'p4'},

  // One-time purchases
  { id: 'f3', clientId: '1', amount: 50.00, date: subDays(new Date(), 60).toISOString(), status: PaymentStatus.Paid, method: PaymentMethod.Cash, description: 'Product: Single Evaluation', type: 'OneTime', relatedId: 'prod1' },
  { id: 'f7', clientId: '4', amount: 75.00, date: subDays(new Date(), 40).toISOString(), status: PaymentStatus.Paid, method: PaymentMethod.CreditCard, description: 'Product: Nutrition Consultation', type: 'OneTime', relatedId: 'prod3' },
];

const MOCK_EVALUATIONS: Evaluation[] = [
  // Alice (Good progress)
  { id: 'e1', clientId: '1', date: subDays(new Date(), 60).toISOString(), weight: 65, height: 1.68, bodyFatPercentage: 22, leanMass: 50.7, notes: 'Initial assessment.', perimeters: { waist: 75, hip: 98, chest: 90, flexedArm: 30 }, skinfolds: { triceps: 15, subscapular: 20, suprailiac: 22, abdominal: 25, thigh: 28 } },
  { id: 'e2', clientId: '1', date: subDays(new Date(), 30).toISOString(), weight: 63.5, bodyFatPercentage: 21, leanMass: 50.1, notes: 'Good progress on cardio.', perimeters: { waist: 73, hip: 97, chest: 91, flexedArm: 30.5 }, skinfolds: { triceps: 14, subscapular: 18, suprailiac: 20, abdominal: 23, thigh: 26 } },
  { id: 'e3', clientId: '1', date: new Date().toISOString(), weight: 62, bodyFatPercentage: 20, leanMass: 49.6, notes: 'Ready for marathon prep phase.', perimeters: { waist: 72, hip: 96, chest: 91, flexedArm: 31 }, skinfolds: { triceps: 13, subscapular: 17, suprailiac: 18, abdominal: 21, thigh: 25 } },
  // Bob (Just started)
  { id: 'e4', clientId: '2', date: subDays(new Date(), 7).toISOString(), weight: 80, height: 1.80, bodyFatPercentage: 18, notes: 'Baseline measurement for hypertrophy program.'},
  // Diana (Single eval)
  { id: 'e5', clientId: '4', date: subDays(new Date(), 40).toISOString(), weight: 70, height: 1.75, bodyFatPercentage: 16.5, leanMass: 58.4, notes: 'Excellent starting point for functional strength.' },
];

export const useStore = create<AppState>((set) => ({
  clients: MOCK_CLIENTS,
  sessions: MOCK_SESSIONS,
  workouts: MOCK_WORKOUTS,
  finances: MOCK_FINANCES,
  evaluations: MOCK_EVALUATIONS,
  plans: MOCK_PLANS,
  products: MOCK_PRODUCTS,
  aiPromptInstructions: '',

  addClient: (client) => set((state) => ({ clients: [...state.clients, client] })),
  updateClient: (id, updates) => set((state) => ({
    clients: state.clients.map(c => c.id === id ? { ...c, ...updates } : c)
  })),
  deleteClient: (id) => set((state) => ({ clients: state.clients.filter(c => c.id !== id) })),

  addSession: (session) => set((state) => ({ sessions: [...state.sessions, session] })),
  
  addRecurringSessions: (baseSession, startDateStr, frequency, untilDateStr) => set((state) => {
    const newSessions: Session[] = [];
    const recurrenceId = `rec-${Math.random().toString(36).substr(2, 9)}`;
    
    let currentDate = parseISO(startDateStr);
    const untilDate = parseISO(untilDateStr);
    const increment = frequency === 'weekly' ? 7 : 14;

    while (currentDate <= untilDate) {
        newSessions.push({
            ...(baseSession as Session),
            id: Math.random().toString(36).substr(2, 9),
            date: currentDate.toISOString(),
            completed: false,
            recurrenceId,
        });
        currentDate = addDays(currentDate, increment);
    }
    return { sessions: [...state.sessions, ...newSessions] };
  }),

  updateSession: (id, updates) => set((state) => ({
    sessions: state.sessions.map(s => s.id === id ? { ...s, ...updates } : s)
  })),

  updateSessionWithScope: (sessionId, updates, scope) => set((state) => {
    const targetSession = state.sessions.find(s => s.id === sessionId);
    if (!targetSession) return {};

    if (scope === 'single' || !targetSession.recurrenceId) {
        return {
            sessions: state.sessions.map(s => s.id === sessionId ? { ...s, ...updates } : s)
        };
    }
    
    const originalDate = parseISO(targetSession.date);
    const newDate = updates.date ? parseISO(updates.date) : originalDate;
    const dateDiff = newDate.getTime() - originalDate.getTime();

    const updatedSessions = state.sessions.map(s => {
        if (s.recurrenceId === targetSession.recurrenceId && parseISO(s.date) >= originalDate) {
            const newSessionDate = new Date(parseISO(s.date).getTime() + dateDiff);
            const { date, ...otherUpdates } = updates;
            return {
                ...s,
                ...otherUpdates,
                date: newSessionDate.toISOString(),
            };
        }
        return s;
    });

    return { sessions: updatedSessions };
  }),

  toggleSessionComplete: (id) => set((state) => ({
    sessions: state.sessions.map(s => s.id === id ? { ...s, completed: !s.completed } : s)
  })),

  addWorkout: (workout) => set((state) => ({ workouts: [...state.workouts, workout] })),
  updateWorkout: (id, updates) => set((state) => ({
    workouts: state.workouts.map(w => w.id === id ? { ...w, ...updates } : w)
  })),
  deleteWorkout: (id) => set((state) => ({ workouts: state.workouts.filter(w => w.id !== id) })),

  addFinanceRecord: (record) => set((state) => ({ finances: [record, ...state.finances] })),
  
  generateMonthlyInvoices: () => set((state) => {
    const today = new Date();
    const currentMonthStr = today.toISOString().slice(0, 7); // YYYY-MM
    const currentMonthName = today.toLocaleString('default', { month: 'long' });
    const newRecords: FinanceRecord[] = [];

    state.clients.forEach(client => {
        if (client.status === ClientStatus.Active && client.planId) {
             const plan = state.plans.find(p => p.id === client.planId);
             if (!plan) return;

             const hasInvoice = state.finances.some(f => 
                 f.clientId === client.id && 
                 f.date.startsWith(currentMonthStr) &&
                 f.relatedId === client.planId &&
                 f.type === 'Subscription'
             );

             if (!hasInvoice) {
                 const monthlyAmount = plan.pricePerSession * plan.sessionsPerWeek * WEEKS_IN_MONTH;
                 newRecords.push({
                     id: Math.random().toString(36).substr(2, 9),
                     clientId: client.id,
                     amount: monthlyAmount,
                     date: today.toISOString(),
                     status: PaymentStatus.Pending,
                     method: PaymentMethod.Pix,
                     description: `Plan: ${plan.name} - ${currentMonthName}`,
                     type: 'Subscription',
                     relatedId: plan.id
                 });
             }
        }
    });

    if (newRecords.length === 0) return {};

    return { finances: [...newRecords, ...state.finances] };
  }),

  markFinanceRecordPaid: (id, method) => set((state) => ({
    finances: state.finances.map(f => f.id === id ? { ...f, status: PaymentStatus.Paid, method } : f)
  })),

  addEvaluation: (evaluation) => set((state) => ({ evaluations: [evaluation, ...state.evaluations] })),

  // Plan Management
  addPlan: (plan) => set((state) => ({ plans: [...state.plans, plan] })),
  updatePlan: (id, updates) => set((state) => ({
    plans: state.plans.map(p => p.id === id ? { ...p, ...updates } : p)
  })),
  deletePlan: (id) => set((state) => ({
    plans: state.plans.filter(p => p.id !== id),
    // Also remove this plan from any clients who have it
    clients: state.clients.map(c => c.planId === id ? { ...c, planId: undefined } : c)
  })),

  updateAiPromptInstructions: (instructions) => set({ aiPromptInstructions: instructions }),
}));