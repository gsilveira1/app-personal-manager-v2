import { StateCreator } from 'zustand';
import { Session } from '../types';
import { AppState } from '../store';

export interface ScheduleSlice {
  sessions: Session[];
  _setSessions: (sessions: Session[]) => void;
  _addSession: (session: Session) => void;
  _addSessions: (sessions: Session[]) => void;
  _updateSession: (session: Session) => void;
  _updateSessionSeries: (sessions: Session[], recurrenceId: string) => void;
}

export const createScheduleSlice: StateCreator<
  AppState,
  [],
  [],
  ScheduleSlice
> = (set) => ({
  sessions: [],
  _setSessions: (sessions) => set({ sessions }),
  _addSession: (session) => set((state) => ({ sessions: [...state.sessions, session] })),
  _addSessions: (sessions) => set((state) => ({ sessions: [...state.sessions, ...sessions] })),
  _updateSession: (session) => set((state) => ({
    sessions: state.sessions.map((s) => (s.id === session.id ? session : s)),
  })),
  _updateSessionSeries: (updatedSessions, recurrenceId) => set((state) => ({
    sessions: [
      ...state.sessions.filter((s) => s.recurrenceId !== recurrenceId),
      ...updatedSessions,
    ],
  })),
});
