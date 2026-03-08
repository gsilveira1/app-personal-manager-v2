import { type Client, type Session, type WorkoutPlan, type Evaluation, type Plan, type User } from '../types'
import apiClient from '../utils/apiClient'

// --- Auth API ---
export const login = async (email: string, pass: string) => {
  const data = await apiClient<{ user: User; access_token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password: pass }),
  })
  localStorage.setItem('token', data.access_token)
  localStorage.setItem('user', JSON.stringify(data.user))
  return { user: data.user, token: data.access_token }
}

export const signup = async (name: string, email: string, pass: string) => {
  const data = await apiClient<{ user: User; access_token: string }>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ name, email, password: pass }),
  })
  localStorage.setItem('token', data.access_token)
  localStorage.setItem('user', JSON.stringify(data.user))
  return { user: data.user, token: data.access_token }
}

export const logout = async () => {
  await apiClient('/auth/logout', { method: 'POST' })
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

export const getCurrentUser = async () => {
  const token = localStorage.getItem('token')
  if (!token) return null
  try {
    return await apiClient<User>('/auth/me')
  } catch (error) {
    console.error('Failed to get current user:', error)
    return null
  }
}

export const requestPasswordReset = async (email: string) => {
  return await apiClient<void>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

// --- Clients API ---
export const getClients = async () => apiClient<Client[]>('/clients')
export const createClient = async (client: Omit<Client, 'id' | 'avatar'>) =>
  apiClient<Client>('/clients', {
    method: 'POST',
    body: JSON.stringify(client),
  })
export const updateClient = async (id: string, updates: Partial<Client>) =>
  apiClient<Client>(`/clients/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  })
export const deleteClient = async (id: string) =>
  apiClient<void>(`/clients/${id}`, {
    method: 'DELETE',
  })
export const getLeads = async () => apiClient<Client[]>('/clients/leads')
export const convertLead = async (id: string, planId?: string) =>
  apiClient<Client>(`/clients/${id}/convert`, {
    method: 'PATCH',
    body: JSON.stringify(planId ? { planId } : {}),
  })

// --- Sessions API ---
export const getSessions = async () => apiClient<Session[]>('/sessions')

export const getSessionsForRange = async (start: Date, end: Date) => apiClient<Session[]>(`/sessions?start=${start.toISOString()}&end=${end.toISOString()}`)

export const createSession = async (session: Omit<Session, 'id' | 'completed'>) =>
  apiClient<Session>('/sessions', {
    method: 'POST',
    body: JSON.stringify(session),
  })

export const createRecurringSessions = async (data: { baseSession: Omit<Session, 'id' | 'date' | 'completed'>; startDateStr: string; frequency: 'weekly' | 'bi-weekly'; untilDateStr: string }) =>
  apiClient<Session[]>('/sessions/recurring', {
    method: 'POST',
    body: JSON.stringify(data),
  })

export const createRecurringEvent = async (dto: {
  rrule: string
  timezone: string
  dtstart: string
  durationMinutes: number
  type: string
  category: string
  clientId: string
  linkedWorkoutId?: string
  notes?: string
}) =>
  apiClient<{ id: string }>('/sessions/recurring-event', {
    method: 'POST',
    body: JSON.stringify(dto),
  })

export const deleteRecurringSeries = async (id: string) => apiClient<void>(`/sessions/recurring-event/${id}`, { method: 'DELETE' })

export const upsertSessionException = async (dto: {
  recurringEventId: string
  originalStartTime: string
  cancelled?: boolean
  newStartTime?: string
  durationMinutes?: number
  notes?: string
  completed?: boolean
}) =>
  apiClient<{ id: string }>('/sessions/exception', {
    method: 'PATCH',
    body: JSON.stringify(dto),
  })

export const updateSession = async (id: string, updates: Partial<Session>) =>
  apiClient<Session>(`/sessions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  })
export const updateSessionWithScope = async (id: string, updates: Partial<Session>, scope: 'single' | 'future') =>
  apiClient<Session>(`/sessions/${id}/scope`, {
    method: 'PATCH',
    body: JSON.stringify({ ...updates, scope }),
  })
export const toggleSessionComplete = async (id: string) =>
  apiClient<Session>(`/sessions/${id}/toggle-complete`, {
    method: 'POST',
  })

// --- Workouts API ---
export const getWorkouts = async () => apiClient<WorkoutPlan[]>('/workouts')
export const createWorkout = async (workout: Omit<WorkoutPlan, 'id' | 'createdAt'>) =>
  apiClient<WorkoutPlan>('/workouts', {
    method: 'POST',
    body: JSON.stringify(workout),
  })
export const updateWorkout = async (id: string, updates: Partial<WorkoutPlan>) =>
  apiClient<WorkoutPlan>(`/workouts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  })
export const deleteWorkout = async (id: string) =>
  apiClient<void>(`/workouts/${id}`, {
    method: 'DELETE',
  })

// --- Evaluations API ---
export const getEvaluations = async () => apiClient<Evaluation[]>('/evaluations')
export const createEvaluation = async (evaluation: Omit<Evaluation, 'id'>) =>
  apiClient<Evaluation>('/evaluations', {
    method: 'POST',
    body: JSON.stringify(evaluation),
  })
export const updateEvaluation = async (id: string, updates: Partial<Evaluation>) =>
  apiClient<Evaluation>(`/evaluations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  })
export const deleteEvaluation = async (id: string) =>
  apiClient<void>(`/evaluations/${id}`, {
    method: 'DELETE',
  })

// --- Plans API ---
export const getPlans = async () => apiClient<Plan[]>('/plans')
export const createPlan = async (plan: Omit<Plan, 'id'>) =>
  apiClient<Plan>('/plans', {
    method: 'POST',
    body: JSON.stringify(plan),
  })
export const updatePlan = async (id: string, updates: Partial<Plan>) =>
  apiClient<Plan>(`/plans/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  })
export const deletePlan = async (id: string) =>
  apiClient<void>(`/plans/${id}`, {
    method: 'DELETE',
  })

// --- Settings API ---
export const getAiInstructions = async () =>
  apiClient<{ instructions: string }>('/settings/ai-instructions')

export const updateAiInstructions = async (instructions: string) =>
  apiClient<{ key: string; value: string }>('/settings/ai-instructions', {
    method: 'PUT',
    body: JSON.stringify({ instructions }),
  })

export const getLanguage = () => apiClient<{ language: string }>('/settings/language')

export const updateLanguage = (language: string) =>
  apiClient<{ language: string }>('/settings/language', {
    method: 'PATCH',
    body: JSON.stringify({ language }),
  })
