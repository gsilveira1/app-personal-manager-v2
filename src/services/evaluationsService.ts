import { Evaluation } from '../types';
import apiClient from '../utils/apiClient';

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
