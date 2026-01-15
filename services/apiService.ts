import { Client, Session, WorkoutPlan, FinanceRecord, Evaluation, Plan, Product, PaymentMethod, User } from '../types';
import apiClient from '../utils/apiClient';

// --- Auth API ---
export const login = async (email: string, pass: string) => {
    const data = await apiClient<{ user: User, token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: pass }),
    });
    localStorage.setItem('authToken', data.token);
    return { user: data.user, token: data.token };
};

export const signup = async (name: string, email: string, pass: string) => {
    const data = await apiClient<{ user: User, token: string }>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ name, email, password: pass }),
    });
    localStorage.setItem('authToken', data.token);
    return { user: data.user, token: data.token };
};

export const logout = async () => {
    // In a real app, you might want to invalidate the token on the server
    // await apiClient('/auth/logout', { method: 'POST' });
    localStorage.removeItem('authToken');
};

export const getCurrentUser = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return null;
    try {
        return await apiClient<User>('/auth/me');
    } catch (error) {
        // If token is invalid, the API will throw an error (e.g. 401)
        console.error("Failed to get current user:", error);
        localStorage.removeItem('authToken'); // Clean up invalid token
        return null;
    }
};

export const requestPasswordReset = async (email: string) => {
    return await apiClient<void>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
    });
};

// --- Clients API ---
export const getClients = async () => apiClient<Client[]>('/clients');
export const createClient = async (client: Omit<Client, 'id' | 'avatar'>) => apiClient<Client>('/clients', {
    method: 'POST',
    body: JSON.stringify(client),
});
export const updateClient = async (id: string, updates: Partial<Client>) => apiClient<Client>(`/clients/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
});
export const deleteClient = async (id: string) => apiClient<void>(`/clients/${id}`, {
    method: 'DELETE',
});

// --- Sessions API ---
export const getSessions = async () => apiClient<Session[]>('/sessions');
export const createSession = async (session: Omit<Session, 'id' | 'completed'>) => apiClient<Session>('/sessions', {
    method: 'POST',
    body: JSON.stringify(session),
});
export const createRecurringSessions = async (data: { baseSession: Omit<Session, 'id' | 'date' | 'completed'>, startDateStr: string, frequency: 'weekly' | 'bi-weekly', untilDateStr: string }) => apiClient<Session[]>('/sessions/recurring', {
    method: 'POST',
    body: JSON.stringify(data),
});
export const updateSession = async (id: string, updates: Partial<Session>) => apiClient<Session>(`/sessions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
});
export const updateRecurringSessions = async (id: string, updates: Partial<Session>) => apiClient<Session[]>(`/sessions/recurring/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
});
export const toggleSessionComplete = async (id: string) => apiClient<Session>(`/sessions/${id}/toggle-complete`, {
    method: 'POST',
});

// --- Workouts API ---
export const getWorkouts = async () => apiClient<WorkoutPlan[]>('/workouts');
export const createWorkout = async (workout: Omit<WorkoutPlan, 'id'>) => apiClient<WorkoutPlan>('/workouts', {
    method: 'POST',
    body: JSON.stringify(workout),
});
export const updateWorkout = async (id: string, updates: Partial<WorkoutPlan>) => apiClient<WorkoutPlan>(`/workouts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
});
export const deleteWorkout = async (id: string) => apiClient<void>(`/workouts/${id}`, {
    method: 'DELETE',
});

// --- Finances API ---
export const getFinances = async () => apiClient<FinanceRecord[]>('/finances');
export const createFinanceRecord = async (record: Omit<FinanceRecord, 'id'>) => apiClient<FinanceRecord>('/finances', {
    method: 'POST',
    body: JSON.stringify(record),
});
export const generateMonthlyInvoices = async () => apiClient<FinanceRecord[]>('/finances/generate-invoices', {
    method: 'POST',
});
export const markFinanceRecordPaid = async (id: string, method: PaymentMethod) => apiClient<FinanceRecord>(`/finances/${id}/mark-paid`, {
    method: 'POST',
    body: JSON.stringify({ method }),
});

// --- Evaluations API ---
export const getEvaluations = async () => apiClient<Evaluation[]>('/evaluations');
export const createEvaluation = async (evaluation: Omit<Evaluation, 'id'>) => apiClient<Evaluation>('/evaluations', {
    method: 'POST',
    body: JSON.stringify(evaluation),
});
export const updateEvaluation = async (id: string, updates: Partial<Evaluation>) => apiClient<Evaluation>(`/evaluations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
});
export const deleteEvaluation = async (id: string) => apiClient<void>(`/evaluations/${id}`, {
    method: 'DELETE',
});

// --- Plans & Products API ---
export const getPlans = async () => apiClient<Plan[]>('/plans');
export const createPlan = async (plan: Omit<Plan, 'id'>) => apiClient<Plan>('/plans', {
    method: 'POST',
    body: JSON.stringify(plan),
});
export const updatePlan = async (id: string, updates: Partial<Plan>) => apiClient<Plan>(`/plans/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
});
export const deletePlan = async (id: string) => apiClient<void>(`/plans/${id}`, {
    method: 'DELETE',
});
export const getProducts = async () => apiClient<Product[]>('/products');

// --- Settings API ---
export const getSettings = async () => apiClient<{ aiPromptInstructions: string }>('/settings');
export const updateAiPromptInstructions = async (instructions: string) => apiClient<{ aiPromptInstructions: string }>('/settings', {
    method: 'POST',
    body: JSON.stringify({ aiPromptInstructions: instructions }),
});
