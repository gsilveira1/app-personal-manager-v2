import { create } from 'zustand';
import { Client, Session, WorkoutPlan, FinanceRecord, Evaluation, Plan, Product, PaymentMethod } from './types';
import * as api from './services/apiService';

interface AppState {
  clients: Client[];
  sessions: Session[];
  workouts: WorkoutPlan[];
  finances: FinanceRecord[];
  evaluations: Evaluation[];
  plans: Plan[];
  products: Product[];
  aiPromptInstructions: string;

  fetchInitialData: () => Promise<void>;
  clearDataOnLogout: () => void;
  
  addClient: (clientData: Omit<Client, 'id' | 'avatar'>, customPlanData?: Omit<Plan, 'id'>) => Promise<void>;
  updateClient: (id: string, client: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  
  addSession: (session: Omit<Session, 'id' | 'completed' | 'recurrenceId'>) => Promise<void>;
  addRecurringSessions: (baseSession: Omit<Session, 'id' | 'date' | 'completed'>, startDateStr: string, frequency: 'weekly' | 'bi-weekly', untilDateStr: string) => Promise<void>;
  updateSession: (id: string, session: Partial<Session>) => Promise<void>;
  updateSessionWithScope: (sessionId: string, updates: Partial<Session>, scope: 'single' | 'future') => Promise<void>;
  toggleSessionComplete: (id: string) => Promise<void>;
  
  addWorkout: (workout: Omit<WorkoutPlan, 'id'>) => Promise<void>;
  updateWorkout: (id: string, workout: Partial<WorkoutPlan>) => Promise<void>;
  deleteWorkout: (id: string) => Promise<void>;
  
  addFinanceRecord: (record: Omit<FinanceRecord, 'id'>) => Promise<void>;
  generateMonthlyInvoices: () => Promise<void>;
  markFinanceRecordPaid: (id: string, method: PaymentMethod) => Promise<void>;
  
  addEvaluation: (evaluation: Omit<Evaluation, 'id'>) => Promise<void>;
  updateEvaluation: (id: string, evaluation: Partial<Evaluation>) => Promise<void>;
  deleteEvaluation: (id: string) => Promise<void>;

  addPlan: (plan: Omit<Plan, 'id'>) => Promise<void>;
  updatePlan: (id: string, plan: Partial<Plan>) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;

  updateAiPromptInstructions: (instructions: string) => Promise<void>;
}

const initialState = {
  clients: [],
  sessions: [],
  workouts: [],
  finances: [],
  evaluations: [],
  plans: [],
  products: [],
  aiPromptInstructions: '',
};

export const useStore = create<AppState>((set, get) => ({
  ...initialState,

  fetchInitialData: async () => {
    try {
      const [clients, sessions, workouts, finances, evaluations, plans, products, settings] = await Promise.all([
        api.getClients(),
        api.getSessions(),
        api.getWorkouts(),
        api.getFinances(),
        api.getEvaluations(),
        api.getPlans(),
        api.getProducts(),
        api.getSettings(),
      ]);
      set({ 
        clients, 
        sessions, 
        workouts, 
        finances, 
        evaluations, 
        plans, 
        products, 
        aiPromptInstructions: settings.aiPromptInstructions,
      });
    } catch (error) {
      console.error("Failed to fetch initial data:", error);
    }
  },
  
  clearDataOnLogout: () => {
    set(initialState);
  },

  addClient: async (clientData, customPlanData) => {
    let finalClientData = { ...clientData };
    if (customPlanData) {
      const newPlan = await api.createPlan(customPlanData);
      set((state) => ({ plans: [...state.plans, newPlan] }));
      finalClientData.planId = newPlan.id;
    }
    const newClient = await api.createClient(finalClientData);
    set((state) => ({ clients: [...state.clients, newClient] }));
  },
  updateClient: async (id, updates) => {
    const updatedClient = await api.updateClient(id, updates);
    set((state) => ({
      clients: state.clients.map(c => c.id === id ? updatedClient : c)
    }));
  },
  deleteClient: async (id) => {
    await api.deleteClient(id);
    set((state) => ({ clients: state.clients.filter(c => c.id !== id) }));
  },

  addSession: async (sessionData) => {
    const newSession = await api.createSession(sessionData);
    set((state) => ({ sessions: [...state.sessions, newSession] }));
  },
  addRecurringSessions: async (baseSession, startDateStr, frequency, untilDateStr) => {
    const newSessions = await api.createRecurringSessions({ baseSession, startDateStr, frequency, untilDateStr });
    set((state) => ({ sessions: [...state.sessions, ...newSessions] }));
  },
  updateSession: async (id, updates) => {
    const updatedSession = await api.updateSession(id, updates);
    set((state) => ({
      sessions: state.sessions.map(s => s.id === id ? updatedSession : s)
    }));
  },
  updateSessionWithScope: async (sessionId, updates, scope) => {
    if (scope === 'single') {
        get().updateSession(sessionId, updates);
    } else {
        const updatedSeries = await api.updateRecurringSessions(sessionId, updates);
        const seriesRecurrenceId = get().sessions.find(s => s.id === sessionId)?.recurrenceId;
        set(state => ({
            sessions: [
                ...state.sessions.filter(s => s.recurrenceId !== seriesRecurrenceId),
                ...updatedSeries,
            ]
        }));
    }
  },
  toggleSessionComplete: async (id) => {
    const updatedSession = await api.toggleSessionComplete(id);
    set((state) => ({
      sessions: state.sessions.map(s => s.id === id ? updatedSession : s)
    }));
  },

  addWorkout: async (workoutData) => {
    const newWorkout = await api.createWorkout(workoutData);
    set((state) => ({ workouts: [...state.workouts, newWorkout] }));
  },
  updateWorkout: async (id, updates) => {
    const updatedWorkout = await api.updateWorkout(id, updates);
    set((state) => ({
      workouts: state.workouts.map(w => w.id === id ? updatedWorkout : w)
    }));
  },
  deleteWorkout: async (id) => {
    await api.deleteWorkout(id);
    set((state) => ({ workouts: state.workouts.filter(w => w.id !== id) }));
  },

  addFinanceRecord: async (recordData) => {
    const newRecord = await api.createFinanceRecord(recordData);
    set((state) => ({ finances: [newRecord, ...state.finances] }));
  },
  generateMonthlyInvoices: async () => {
    const newInvoices = await api.generateMonthlyInvoices();
    if (newInvoices.length > 0) {
        set((state) => ({ finances: [...newInvoices, ...state.finances] }));
    }
  },
  markFinanceRecordPaid: async (id, method) => {
    const updatedRecord = await api.markFinanceRecordPaid(id, method);
    set((state) => ({
      finances: state.finances.map(f => f.id === id ? updatedRecord : f)
    }));
  },

  addEvaluation: async (evaluationData) => {
    const newEvaluation = await api.createEvaluation(evaluationData);
    set((state) => ({ evaluations: [newEvaluation, ...state.evaluations] }));
  },
  updateEvaluation: async (id, updates) => {
    const updatedEvaluation = await api.updateEvaluation(id, updates);
    set((state) => ({
      evaluations: state.evaluations.map(e => e.id === id ? updatedEvaluation : e)
    }));
  },
  deleteEvaluation: async (id) => {
    await api.deleteEvaluation(id);
    set((state) => ({ evaluations: state.evaluations.filter(e => e.id !== id) }));
  },

  addPlan: async (planData) => {
    const newPlan = await api.createPlan(planData);
    set((state) => ({ plans: [...state.plans, newPlan] }));
  },
  updatePlan: async (id, updates) => {
    const updatedPlan = await api.updatePlan(id, updates);
    set((state) => ({
      plans: state.plans.map(p => p.id === id ? updatedPlan : p)
    }));
  },
  deletePlan: async (id) => {
    await api.deletePlan(id);
    set((state) => ({
      plans: state.plans.filter(p => p.id !== id),
      clients: state.clients.map(c => c.planId === id ? { ...c, planId: undefined } : c)
    }));
  },

  updateAiPromptInstructions: async (instructions: string) => {
    const settings = await api.updateAiPromptInstructions(instructions);
    set({ aiPromptInstructions: settings.aiPromptInstructions });
  },
}));