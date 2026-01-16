import { StateCreator } from 'zustand';
import { Client } from '../types';
import { AppState } from '../store';

export interface ClientSlice {
  clients: Client[];
  _setClients: (clients: Client[]) => void;
  _addClient: (client: Client) => void;
  _updateClient: (client: Client) => void;
  _removeClient: (clientId: string) => void;
}

export const createClientSlice: StateCreator<
  AppState,
  [],
  [],
  ClientSlice
> = (set) => ({
  clients: [],
  _setClients: (clients) => set({ clients }),
  _addClient: (client) => set((state) => ({ clients: [...state.clients, client] })),
  _updateClient: (client) => set((state) => ({
    clients: state.clients.map((c) => (c.id === client.id ? client : c)),
  })),
  _removeClient: (clientId) => set((state) => ({
    clients: state.clients.filter((c) => c.id !== clientId),
  })),
});
