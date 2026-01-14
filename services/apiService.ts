import { Client, Session, WorkoutPlan, FinanceRecord, Evaluation, Plan, Product, PaymentMethod, PaymentStatus, User } from '../types';
import * as mock from './mockData';
import { format } from 'date-fns';

const generateId = () => Math.random().toString(36).substr(2, 9);
const generateAvatar = (seed: string) => `https://i.pravatar.cc/150?u=${seed}`;
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// --- Auth API ---
export const login = async (email: string, pass: string) => {
    await delay(500);
    const user = mock.users.find(u => u.email === email && u.password === pass);
    if (user) {
        const token = `mock-token-${user.id}`;
        localStorage.setItem('authToken', token);
        const { password, ...userWithoutPassword } = user;
        return { user: userWithoutPassword, token };
    }
    throw new Error('Invalid credentials');
};

export const signup = async (name: string, email: string, pass: string) => {
    await delay(500);
    if (mock.users.find(u => u.email === email)) {
        throw new Error('User already exists');
    }
    const newUser = { id: generateId(), name, email, password: pass };
    mock.users.push(newUser);
    const token = `mock-token-${newUser.id}`;
    localStorage.setItem('authToken', token);
    const { password, ...userWithoutPassword } = newUser;
    return { user: userWithoutPassword, token };
};

export const logout = async () => {
    await delay(100);
    localStorage.removeItem('authToken');
};

export const getCurrentUser = async () => {
    await delay(200);
    const token = localStorage.getItem('authToken');
    if (token) {
        const userId = token.replace('mock-token-', '');
        const user = mock.users.find(u => u.id === userId);
        if (user) {
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        }
    }
    return null;
};

export const requestPasswordReset = async (email: string) => {
    await delay(500);
    console.log(`Password reset requested for ${email}. In a real app, an email would be sent.`);
    return true;
};

// --- Clients API ---
export const getClients = async () => { await delay(100); return mock.clients; };
export const createClient = async (client: Omit<Client, 'id'>) => {
  await delay(200);
  const newClient: Client = {
    ...client,
    id: generateId(),
    avatar: generateAvatar(client.email),
  };
  mock.clients.push(newClient);
  return newClient;
};
export const updateClient = async (id: string, updates: Partial<Client>) => {
  await delay(200);
  const clientIndex = mock.clients.findIndex(c => c.id === id);
  if (clientIndex === -1) throw new Error('Client not found');
  mock.clients[clientIndex] = { ...mock.clients[clientIndex], ...updates };
  return mock.clients[clientIndex];
};
export const deleteClient = async (id: string) => {
  await delay(200);
  const clientIndex = mock.clients.findIndex(c => c.id === id);
  if (clientIndex !== -1) {
    mock.clients.splice(clientIndex, 1);
  }
  return;
};

// --- Sessions API ---
export const getSessions = async () => { await delay(100); return mock.sessions; };
export const createSession = async (session: Omit<Session, 'id' | 'completed'>) => {
  await delay(200);
  const newSession: Session = { ...session, id: generateId(), completed: false };
  mock.sessions.push(newSession);
  return newSession;
};
export const createRecurringSessions = async (data: { baseSession: Omit<Session, 'id' | 'date' | 'completed'>, startDateStr: string, frequency: 'weekly' | 'bi-weekly', untilDateStr: string }) => {
    await delay(300);
    const { baseSession, startDateStr, frequency, untilDateStr } = data;
    const newSessions: Session[] = [];
    const recurrenceId = generateId();
    let currentDate = new Date(startDateStr);
    const untilDate = new Date(untilDateStr);
    const increment = frequency === 'weekly' ? 7 : 14;

    while (currentDate <= untilDate) {
        newSessions.push({
            ...baseSession,
            id: generateId(),
            date: currentDate.toISOString(),
            completed: false,
            recurrenceId,
        });
        currentDate = new Date(currentDate.setDate(currentDate.getDate() + increment));
    }
    mock.sessions.push(...newSessions);
    return newSessions;
};
export const updateSession = async (id: string, updates: Partial<Session>) => {
  await delay(200);
  const sessionIndex = mock.sessions.findIndex(s => s.id === id);
  if (sessionIndex === -1) throw new Error('Session not found');
  mock.sessions[sessionIndex] = { ...mock.sessions[sessionIndex], ...updates };
  return mock.sessions[sessionIndex];
};
export const updateRecurringSessions = async (id: string, updates: Partial<Session>) => {
    await delay(300);
    const session = mock.sessions.find(s => s.id === id);
    if (!session?.recurrenceId) return [await updateSession(id, updates)];

    const updatedSeries: Session[] = [];
    const sessionDate = new Date(session.date);

    const sessionsToKeep: Session[] = [];
    for (const s of mock.sessions) {
      if (s.recurrenceId === session.recurrenceId && new Date(s.date) >= sessionDate) {
        // Create a new session object with the updates, but preserve original ID and date for this specific instance
        const updatedSessionData = { ...s, ...updates };
        // Ensure the date isn't accidentally overwritten by updates if only time changed
        updatedSessionData.date = updates.date || s.date;
        updatedSeries.push(updatedSessionData);
        // This session will be removed and replaced by the updated version.
      } else {
        sessionsToKeep.push(s);
      }
    }

    mock.sessions.length = 0;
    mock.sessions.push(...sessionsToKeep);
    
    mock.sessions.push(...updatedSeries.map(us => ({...us, id: us.id}))); // Ensure they are new objects
    return updatedSeries;
};

export const toggleSessionComplete = async (id: string) => {
  await delay(200);
  const session = mock.sessions.find(s => s.id === id);
  if (!session) throw new Error('Session not found');
  session.completed = !session.completed;
  return { ...session };
};

// --- Workouts API ---
export const getWorkouts = async () => { await delay(100); return mock.workouts; };
export const createWorkout = async (workout: Omit<WorkoutPlan, 'id'>) => {
  await delay(200);
  const newWorkout: WorkoutPlan = { ...workout, id: generateId() };
  mock.workouts.push(newWorkout);
  return newWorkout;
};
export const updateWorkout = async (id: string, updates: Partial<WorkoutPlan>) => {
  await delay(200);
  const workoutIndex = mock.workouts.findIndex(w => w.id === id);
  if (workoutIndex === -1) throw new Error('Workout not found');
  mock.workouts[workoutIndex] = { ...mock.workouts[workoutIndex], ...updates };
  return mock.workouts[workoutIndex];
};
export const deleteWorkout = async (id: string) => {
  await delay(200);
  const workoutIndex = mock.workouts.findIndex(w => w.id === id);
  if (workoutIndex !== -1) {
    mock.workouts.splice(workoutIndex, 1);
  }
  return;
};

// --- Finances API ---
export const getFinances = async () => { await delay(100); return mock.finances; };
export const createFinanceRecord = async (record: Omit<FinanceRecord, 'id'>) => {
  await delay(200);
  const newRecord: FinanceRecord = { ...record, id: generateId() };
  mock.finances.unshift(newRecord);
  return newRecord;
};
export const generateMonthlyInvoices = async () => {
  await delay(500);
  const today = new Date();
  const thisMonth = today.getMonth();
  const thisYear = today.getFullYear();
  const activeClients = mock.clients.filter(c => c.status === 'Active' && c.planId);
  const newInvoices: FinanceRecord[] = [];

  for (const client of activeClients) {
    const plan = mock.plans.find(p => p.id === client.planId);
    if (!plan) continue;
    
    const existingInvoice = mock.finances.find(f => 
      f.clientId === client.id &&
      f.type === 'Subscription' &&
      new Date(f.date).getMonth() === thisMonth &&
      new Date(f.date).getFullYear() === thisYear
    );
    
    if (!existingInvoice) {
      const amount = plan.pricePerSession * plan.sessionsPerWeek * 4.33;
      const newInvoice: FinanceRecord = {
        id: generateId(),
        clientId: client.id,
        amount: parseFloat(amount.toFixed(2)),
        date: new Date().toISOString(),
        status: PaymentStatus.Pending,
        method: PaymentMethod.CreditCard, // Default
        description: `Subscription - ${format(new Date(), 'MMMM yyyy')}`,
        type: 'Subscription',
        relatedId: plan.id,
      };
      newInvoices.push(newInvoice);
    }
  }
  mock.finances.unshift(...newInvoices);
  return newInvoices;
};
export const markFinanceRecordPaid = async (id: string, method: PaymentMethod) => {
  await delay(200);
  const record = mock.finances.find(f => f.id === id);
  if (!record) throw new Error('Record not found');
  record.status = PaymentStatus.Paid;
  record.method = method;
  return { ...record };
};

// --- Evaluations API ---
export const getEvaluations = async () => { await delay(100); return mock.evaluations; };
export const createEvaluation = async (evaluation: Omit<Evaluation, 'id'>) => {
  await delay(200);
  const newEval: Evaluation = { ...evaluation, id: generateId() };
  mock.evaluations.unshift(newEval);
  return newEval;
};
export const updateEvaluation = async (id: string, updates: Partial<Evaluation>) => {
  await delay(200);
  const evalIndex = mock.evaluations.findIndex(e => e.id === id);
  if (evalIndex === -1) throw new Error('Evaluation not found');
  mock.evaluations[evalIndex] = { ...mock.evaluations[evalIndex], ...updates };
  return mock.evaluations[evalIndex];
};
export const deleteEvaluation = async (id: string) => {
  await delay(200);
  const evalIndex = mock.evaluations.findIndex(e => e.id === id);
  if (evalIndex !== -1) {
    mock.evaluations.splice(evalIndex, 1);
  }
  return;
};

// --- Plans & Products API ---
export const getPlans = async () => { await delay(100); return mock.plans; };
export const createPlan = async (plan: Omit<Plan, 'id'>) => {
  await delay(200);
  const newPlan: Plan = { ...plan, id: generateId() };
  mock.plans.push(newPlan);
  return newPlan;
};
export const updatePlan = async (id: string, updates: Partial<Plan>) => {
  await delay(200);
  const planIndex = mock.plans.findIndex(p => p.id === id);
  if (planIndex === -1) throw new Error('Plan not found');
  mock.plans[planIndex] = { ...mock.plans[planIndex], ...updates };
  return mock.plans[planIndex];
};
export const deletePlan = async (id: string) => {
  await delay(200);
  const planIndex = mock.plans.findIndex(p => p.id === id);
  if (planIndex !== -1) {
    mock.plans.splice(planIndex, 1);
  }
  // Also unassign from clients
  mock.clients.forEach(c => {
    if (c.planId === id) {
      c.planId = undefined;
    }
  });
  return;
};
export const getProducts = async () => { await delay(100); return mock.products; };

// --- Settings API ---
let settings = { aiPromptInstructions: 'Focus on compound movements and functional fitness.' };
export const getSettings = async () => {
    await delay(50);
    return settings;
};
export const updateAiPromptInstructions = async (instructions: string) => {
    await delay(100);
    settings.aiPromptInstructions = instructions;
    return settings;
};