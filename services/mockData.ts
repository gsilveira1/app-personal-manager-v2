import { Client, ClientStatus, Session, WorkoutPlan, FinanceRecord, PaymentStatus, PaymentMethod, Evaluation, Plan, Product, User } from '../types';
// FIX: Consolidate date-fns imports to resolve module resolution errors.
import { subDays, addDays, formatISO } from 'date-fns';

// FIX: Added missing 'users' mock data required by the auth logic in apiService.ts
export let users: (User & { password?: string })[] = [
  { id: 'user1', name: 'Coach Alex', email: 'alex@example.com', password: 'password123' }
];

// --- Helper Functions ---
const today = new Date();

// --- Plans & Products ---
export let plans: Plan[] = [
  { id: 'plan1', name: 'Starter Hybrid', sessionsPerWeek: 2, sessionDurationMinutes: 60, pricePerSession: 50 },
  { id: 'plan2', name: 'Pro Online', sessionsPerWeek: 1, sessionDurationMinutes: 30, pricePerSession: 35 },
  { id: 'plan3', name: 'Elite In-Person', sessionsPerWeek: 4, sessionDurationMinutes: 60, pricePerSession: 65 },
];

export let products: Product[] = [
  { id: 'prod1', name: 'Initial Fitness Assessment', price: 75, category: 'Evaluation' },
  { id: 'prod2', name: '8-Week Hypertrophy Template', price: 49.99, category: 'Workout Template' },
];


// --- Clients ---
export let clients: Client[] = [
  {
    id: 'client1',
    name: 'Eleanor Vance',
    email: 'eleanor@example.com',
    phone: '555-0101',
    status: ClientStatus.Active,
    type: 'In-Person',
    dateOfBirth: '1990-05-15',
    goal: 'Build muscle and increase strength',
    notes: 'Previous shoulder injury on the right side. Be cautious with overhead presses.',
    avatar: `https://i.pravatar.cc/150?u=eleanor@example.com`,
    planId: 'plan3',
  },
  {
    id: 'client2',
    name: 'Marcus Holloway',
    email: 'marcus@example.com',
    phone: '555-0102',
    status: ClientStatus.Active,
    type: 'Online',
    checkInFrequency: 'Weekly',
    dateOfBirth: '1995-11-20',
    goal: 'Improve marathon time',
    avatar: `https://i.pravatar.cc/150?u=marcus@example.com`,
    planId: 'plan2',
  },
  {
    id: 'client3',
    name: 'Sofia Rossi',
    email: 'sofia@example.com',
    phone: '555-0103',
    status: ClientStatus.Inactive,
    type: 'In-Person',
    dateOfBirth: '1988-02-10',
    goal: 'General fitness and weight loss',
    avatar: `https://i.pravatar.cc/150?u=sofia@example.com`,
    planId: 'plan1',
  },
    {
    id: 'client4',
    name: 'Jameson Carter',
    email: 'jameson@example.com',
    phone: '555-0104',
    status: ClientStatus.Lead,
    type: 'Online',
    goal: 'Looking for a structured weightlifting program',
    avatar: `https://i.pravatar.cc/150?u=jameson@example.com`,
  },
];

// --- Sessions ---
export let sessions: Session[] = [
  // Eleanor (client1)
  { id: 'sess1', clientId: 'client1', date: formatISO(subDays(today, 15)), durationMinutes: 60, type: 'In-Person', category: 'Workout', completed: true, recurrenceId: 'rec1' },
  { id: 'sess2', clientId: 'client1', date: formatISO(subDays(today, 8)), durationMinutes: 60, type: 'In-Person', category: 'Workout', completed: true, recurrenceId: 'rec1' },
  { id: 'sess3', clientId: 'client1', date: formatISO(subDays(today, 1)), durationMinutes: 60, type: 'In-Person', category: 'Workout', completed: true, recurrenceId: 'rec1' },
  { id: 'sess4', clientId: 'client1', date: formatISO(addDays(today, 6)), durationMinutes: 60, type: 'In-Person', category: 'Workout', completed: false, recurrenceId: 'rec1' },
  // Today's session for Eleanor
  { id: 'sess5', clientId: 'client1', date: new Date(today.setHours(10, 0, 0, 0)).toISOString(), durationMinutes: 60, type: 'In-Person', category: 'Workout', completed: false },

  // Marcus (client2)
  { id: 'sess6', clientId: 'client2', date: formatISO(subDays(today, 10)), durationMinutes: 30, type: 'Online', category: 'Check-in', completed: true },
  // Today's session for Marcus
  { id: 'sess7', clientId: 'client2', date: new Date(today.setHours(14, 30, 0, 0)).toISOString(), durationMinutes: 30, type: 'Online', category: 'Check-in', completed: false },
  { id: 'sess8', clientId: 'client2', date: formatISO(addDays(today, 4)), durationMinutes: 30, type: 'Online', category: 'Check-in', completed: false },
  
  // Sofia (client3 - inactive, past sessions)
  { id: 'sess9', clientId: 'client3', date: formatISO(subDays(today, 40)), durationMinutes: 60, type: 'In-Person', category: 'Workout', completed: true },
  { id: 'sess10', clientId: 'client3', date: formatISO(subDays(today, 33)), durationMinutes: 60, type: 'In-Person', category: 'Workout', completed: true },
];

// --- Workouts ---
export let workouts: WorkoutPlan[] = [
  { id: 'workout1', title: 'Full Body Strength', description: 'A balanced workout targeting all major muscle groups.', exercises: [{ name: 'Squat', sets: 3, reps: '8-10' }, { name: 'Bench Press', sets: 3, reps: '8-10' }, { name: 'Deadlift', sets: 1, reps: '5' }], tags: ['Strength', 'Full Body'], createdAt: formatISO(subDays(today, 30)) },
  { id: 'workout2', title: 'HIIT Cardio Blast', description: 'High-intensity interval training for maximum calorie burn.', exercises: [{ name: 'Burpees', sets: 5, reps: '60s' }, { name: 'Kettlebell Swings', sets: 5, reps: '60s' }], tags: ['Cardio', 'HIIT', '30min'], createdAt: formatISO(subDays(today, 60)) },
  // Prescription for Eleanor
  { id: 'workout3', clientId: 'client1', title: 'Eleanor\'s Phase 1: Foundation', description: 'Focus on building a solid strength base, respecting shoulder health.', exercises: [{ name: 'Goblet Squat', sets: 3, reps: '12' }, { name: 'Dumbbell Bench Press', sets: 3, reps: '10' }], tags: ['Strength', 'Foundation'], createdAt: formatISO(subDays(today, 25)), status: 'Active' },
];

// --- Finances ---
const lastMonth = subDays(today, 30);
const twoMonthsAgo = subDays(today, 60);

export let finances: FinanceRecord[] = [
  // Paid
  { id: 'fin1', clientId: 'client1', amount: 260, date: formatISO(twoMonthsAgo), status: PaymentStatus.Paid, method: PaymentMethod.CreditCard, description: `Subscription - ${formatISO(twoMonthsAgo, { representation: 'date' })}`, type: 'Subscription' },
  { id: 'fin2', clientId: 'client2', amount: 35, date: formatISO(twoMonthsAgo), status: PaymentStatus.Paid, method: PaymentMethod.Pix, description: `Subscription - ${formatISO(twoMonthsAgo, { representation: 'date' })}`, type: 'Subscription' },
  // Pending
  { id: 'fin3', clientId: 'client1', amount: 260, date: formatISO(lastMonth), status: PaymentStatus.Pending, method: PaymentMethod.CreditCard, description: `Subscription - ${formatISO(lastMonth, { representation: 'date' })}`, type: 'Subscription' },
  // Overdue
  { id: 'fin4', clientId: 'client3', amount: 200, date: formatISO(twoMonthsAgo), status: PaymentStatus.Overdue, method: PaymentMethod.Transfer, description: `Subscription - ${formatISO(twoMonthsAgo, { representation: 'date' })}`, type: 'Subscription' },
  // One-time sale
  { id: 'fin5', clientId: 'client2', amount: 75, date: formatISO(subDays(today, 50)), status: PaymentStatus.Paid, method: PaymentMethod.Cash, description: 'Product: Initial Fitness Assessment', type: 'OneTime', relatedId: 'prod1' },
];

// --- Evaluations ---
export let evaluations: Evaluation[] = [
  { id: 'eval1', clientId: 'client1', date: formatISO(subDays(today, 90)), weight: 68, bodyFatPercentage: 25, leanMass: 51, perimeters: { waist: 75, hip: 100 }, skinfolds: { triceps: 18, abdominal: 25 } },
  { id: 'eval2', clientId: 'client1', date: formatISO(subDays(today, 45)), weight: 66, bodyFatPercentage: 23, leanMass: 50.8, perimeters: { waist: 72, hip: 98 }, skinfolds: { triceps: 16, abdominal: 22 } },
  { id: 'eval3', clientId: 'client1', date: formatISO(subDays(today, 5)), weight: 65, bodyFatPercentage: 22, leanMass: 50.7, perimeters: { waist: 70, hip: 97 }, skinfolds: { triceps: 15, abdominal: 20 } },
];