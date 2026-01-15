import { Session } from '../types';
import apiClient from '../utils/apiClient';

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