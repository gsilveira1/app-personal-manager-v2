import { WorkoutPlan } from '../types';
import apiClient from '../utils/apiClient';

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
