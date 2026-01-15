import { Plan, Product } from '../types';
import apiClient from '../utils/apiClient';

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
