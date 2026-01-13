import { Client, Session, WorkoutPlan, FinanceRecord, Evaluation, Plan, Product, PaymentMethod } from '../types';

const API_BASE_URL = '/api'; // Using a relative path, assumes backend is on the same host

/**
 * A generic helper function for making API requests.
 * It handles setting JSON headers, parsing the response, and error handling.
 * @param url The API endpoint to call (e.g., '/clients')
 * @param options The standard fetch options (method, body, etc.)
 * @returns A promise that resolves with the JSON response.
 */
async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, { ...options, headers });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'An unknown API error occurred.' }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    // Handle 204 No Content response for DELETE requests
    if (response.status === 204) {
      return null as T;
    }

    return response.json();
  } catch (error) {
    console.error(`API request to ${url} failed:`, error);
    throw error;
  }
}

// --- Clients API ---
export const getClients = () => apiRequest<Client[]>('/clients');
export const createClient = (client: Omit<Client, 'id'>) => apiRequest<Client>('/clients', { method: 'POST', body: JSON.stringify(client) });
export const updateClient = (id: string, updates: Partial<Client>) => apiRequest<Client>(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
export const deleteClient = (id: string) => apiRequest<void>(`/clients/${id}`, { method: 'DELETE' });

// --- Sessions API ---
export const getSessions = () => apiRequest<Session[]>('/sessions');
export const createSession = (session: Omit<Session, 'id' | 'completed'>) => apiRequest<Session>('/sessions', { method: 'POST', body: JSON.stringify(session) });
export const createRecurringSessions = (data: { baseSession: Omit<Session, 'id' | 'date' | 'completed'>, startDateStr: string, frequency: 'weekly' | 'bi-weekly', untilDateStr: string }) => apiRequest<Session[]>('/sessions/recurring', { method: 'POST', body: JSON.stringify(data) });
export const updateSession = (id: string, updates: Partial<Session>) => apiRequest<Session>(`/sessions/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
export const updateRecurringSessions = (id: string, updates: Partial<Session>) => apiRequest<Session[]>(`/sessions/${id}/recurring`, { method: 'PUT', body: JSON.stringify(updates) });
export const toggleSessionComplete = (id: string) => apiRequest<Session>(`/sessions/${id}/toggle-complete`, { method: 'PATCH' });


// --- Workouts API ---
export const getWorkouts = () => apiRequest<WorkoutPlan[]>('/workouts');
export const createWorkout = (workout: Omit<WorkoutPlan, 'id'>) => apiRequest<WorkoutPlan>('/workouts', { method: 'POST', body: JSON.stringify(workout) });
export const updateWorkout = (id: string, updates: Partial<WorkoutPlan>) => apiRequest<WorkoutPlan>(`/workouts/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
export const deleteWorkout = (id: string) => apiRequest<void>(`/workouts/${id}`, { method: 'DELETE' });

// --- Finances API ---
export const getFinances = () => apiRequest<FinanceRecord[]>('/finances');
export const createFinanceRecord = (record: Omit<FinanceRecord, 'id'>) => apiRequest<FinanceRecord>('/finances', { method: 'POST', body: JSON.stringify(record) });
export const generateMonthlyInvoices = () => apiRequest<FinanceRecord[]>('/finances/generate-invoices', { method: 'POST' });
export const markFinanceRecordPaid = (id: string, method: PaymentMethod) => apiRequest<FinanceRecord>(`/finances/${id}/mark-paid`, { method: 'PATCH', body: JSON.stringify({ method }) });

// --- Evaluations API ---
export const getEvaluations = () => apiRequest<Evaluation[]>('/evaluations');
export const createEvaluation = (evaluation: Omit<Evaluation, 'id'>) => apiRequest<Evaluation>('/evaluations', { method: 'POST', body: JSON.stringify(evaluation) });

// --- Plans & Products API ---
export const getPlans = () => apiRequest<Plan[]>('/plans');
export const createPlan = (plan: Omit<Plan, 'id'>) => apiRequest<Plan>('/plans', { method: 'POST', body: JSON.stringify(plan) });
export const updatePlan = (id: string, updates: Partial<Plan>) => apiRequest<Plan>(`/plans/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
export const deletePlan = (id: string) => apiRequest<void>(`/plans/${id}`, { method: 'DELETE' });
export const getProducts = () => apiRequest<Product[]>('/products');


// --- Settings API ---
export const getSettings = () => apiRequest<{ aiPromptInstructions: string }>('/settings');
export const updateAiPromptInstructions = (instructions: string) => apiRequest<{ aiPromptInstructions: string }>('/settings/ai-instructions', { method: 'PUT', body: JSON.stringify({ instructions }) });
