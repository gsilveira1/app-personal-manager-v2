import { Client } from '../types';
import apiClient from '../utils/apiClient';

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