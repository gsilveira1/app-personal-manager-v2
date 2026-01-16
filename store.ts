import { create } from 'zustand';
import { Client, Session, WorkoutPlan, FinanceRecord, Evaluation, Plan, Product, PaymentMethod } from './types';
import * as api from './services/apiService';
import { ApiError } from './utils/apiClient';
import { ClientSlice, createClientSlice } from './store/clientSlice';
import { ScheduleSlice, createScheduleSlice } from './store/scheduleSlice';
import { WorkoutSlice, createWorkoutSlice } from './store/workoutSlice';
import { FinanceSlice, createFinanceSlice } from './store/financeSlice';
import { EvaluationSlice, createEvaluationSlice } from './store/evaluationSlice';
import { SettingsSlice, createSettingsSlice } from './store/settingsSlice';

// Combine all slice interfaces and add async actions
export type AppState = ClientSlice &
  ScheduleSlice &
  WorkoutSlice &
  FinanceSlice &
  EvaluationSlice &
  SettingsSlice & {
    appState: 'idle' | 'loading' | 'ready' | 'error';
    errorMessage: string | null;
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
  };

export const useStore = create<AppState>()((set, get) => ({
  ...createClientSlice(set, get, {} as any),
  ...createScheduleSlice(set, get, {} as any),
  ...createWorkoutSlice(set, get, {} as any),
  ...createFinanceSlice(set, get, {} as any),
  ...createEvaluationSlice(set, get, {} as any),
  ...createSettingsSlice(set, get, {} as any),
  appState: 'idle',
  errorMessage: null,

  fetchInitialData: async () => {
    set({ appState: 'loading', errorMessage: null });
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
      get()._setClients(clients);
      get()._setSessions(sessions);
      get()._setWorkouts(workouts);
      get()._setFinances(finances);
      get()._setEvaluations(evaluations);
      get()._setPlans(plans);
      get()._setProducts(products);
      get()._setAiPromptInstructions(settings.aiPromptInstructions);
      set({ appState: 'ready' });
    } catch (error) {
      console.error("Failed to fetch initial data:", error);
      if (error instanceof ApiError && error.status === 401) {
          useAuthStore.getState().logout();
          set({ appState: 'idle' });
      } else {
          set({ appState: 'error', errorMessage: (error as Error).message });
      }
    }
  },

  clearDataOnLogout: () => {
    set({
      clients: [],
      sessions: [],
      workouts: [],
      finances: [],
      evaluations: [],
      plans: [],
      products: [],
      aiPromptInstructions: '',
      appState: 'idle',
      errorMessage: null,
    });
  },

  addClient: async (clientData, customPlanData) => {
    let finalClientData = { ...clientData };
    if (customPlanData) {
      const newPlan = await api.createPlan(customPlanData);
      get()._addPlan(newPlan);
      finalClientData.planId = newPlan.id;
    }
    const newClient = await api.createClient(finalClientData);
    get()._addClient(newClient);
  },
  updateClient: async (id, updates) => {
    const updatedClient = await api.updateClient(id, updates);
    get()._updateClient(updatedClient);
  },
  deleteClient: async (id) => {
    await api.deleteClient(id);
    get()._removeClient(id);
  },

  addSession: async (sessionData) => {
    const newSession = await api.createSession(sessionData);
    get()._addSession(newSession);
  },
  addRecurringSessions: async (baseSession, startDateStr, frequency, untilDateStr) => {
    const newSessions = await api.createRecurringSessions({ baseSession, startDateStr, frequency, untilDateStr });
    get()._addSessions(newSessions);
  },
  updateSession: async (id, updates) => {
    const updatedSession = await api.updateSession(id, updates);
    get()._updateSession(updatedSession);
  },
  updateSessionWithScope: async (sessionId, updates, scope) => {
    if (scope === 'single') {
      get().updateSession(sessionId, updates);
    } else {
      const updatedSeries = await api.updateRecurringSessions(sessionId, updates);
      const seriesRecurrenceId = get().sessions.find((s) => s.id === sessionId)?.recurrenceId;
      if (seriesRecurrenceId) {
        get()._updateSessionSeries(updatedSeries, seriesRecurrenceId);
      }
    }
  },
  toggleSessionComplete: async (id) => {
    const updatedSession = await api.toggleSessionComplete(id);
    get()._updateSession(updatedSession);
  },

  addWorkout: async (workoutData) => {
    const newWorkout = await api.createWorkout(workoutData);
    get()._addWorkout(newWorkout);
  },
  updateWorkout: async (id, updates) => {
    const updatedWorkout = await api.updateWorkout(id, updates);
    get()._updateWorkout(updatedWorkout);
  },
  deleteWorkout: async (id) => {
    await api.deleteWorkout(id);
    get()._removeWorkout(id);
  },

  addFinanceRecord: async (recordData) => {
    const newRecord = await api.createFinanceRecord(recordData);
    get()._addFinanceRecord(newRecord);
  },
  generateMonthlyInvoices: async () => {
    const newInvoices = await api.generateMonthlyInvoices();
    if (newInvoices.length > 0) {
      get()._addFinanceRecords(newInvoices);
    }
  },
  markFinanceRecordPaid: async (id, method) => {
    const updatedRecord = await api.markFinanceRecordPaid(id, method);
    get()._updateFinanceRecord(updatedRecord);
  },

  addEvaluation: async (evaluationData) => {
    const newEvaluation = await api.createEvaluation(evaluationData);
    get()._addEvaluation(newEvaluation);
  },
  updateEvaluation: async (id, updates) => {
    const updatedEvaluation = await api.updateEvaluation(id, updates);
    get()._updateEvaluation(updatedEvaluation);
  },
  deleteEvaluation: async (id) => {
    await api.deleteEvaluation(id);
    get()._removeEvaluation(id);
  },

  addPlan: async (planData) => {
    const newPlan = await api.createPlan(planData);
    get()._addPlan(newPlan);
  },
  updatePlan: async (id, updates) => {
    const updatedPlan = await api.updatePlan(id, updates);
    get()._updatePlan(updatedPlan);
  },
  deletePlan: async (id) => {
    await api.deletePlan(id);
    get()._removePlan(id);
    set((state) => ({
      clients: state.clients.map(c => c.planId === id ? { ...c, planId: undefined } : c)
    }));
  },

  updateAiPromptInstructions: async (instructions: string) => {
    const settings = await api.updateAiPromptInstructions(instructions);
    get()._setAiPromptInstructions(settings.aiPromptInstructions);
  },
}));

// Need to import authStore here to prevent circular dependency issues
// if other stores were to import authStore.
import { useAuthStore } from './store/authStore';
