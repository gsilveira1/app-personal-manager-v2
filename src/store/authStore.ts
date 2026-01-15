import { create } from 'zustand';
import { User } from '../types';
import * as api from '../services/authService';
import { useStore } from '../store';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, pass) => {
    const { user } = await api.login(email, pass);
    set({ user, isAuthenticated: true });
  },

  signup: async (name, email, pass) => {
    const { user } = await api.signup(name, email, pass);
    set({ user, isAuthenticated: true });
  },

  logout: async () => {
    await api.logout();
    useStore.getState().clearDataOnLogout(); // Clear main app data
    set({ user: null, isAuthenticated: false });
  },

  checkAuthStatus: async () => {
    set({ isLoading: true });
    try {
      const user = await api.getCurrentUser();
      if (user) {
        set({ user, isAuthenticated: true });
      } else {
        set({ user: null, isAuthenticated: false });
      }
    } catch (error) {
      console.error("Auth check failed", error);
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },
}));
