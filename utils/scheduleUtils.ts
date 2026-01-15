import { Session } from '../types';
// FIX: Consolidate date-fns imports to resolve module resolution errors.
import { parseISO } from 'date-fns/parseISO';
import { addMinutes } from 'date-fns/addMinutes';

/**
 * Checks if a given time slot is already occupied by another session.
 * @param sessions - The array of all current sessions.
 * @param newSessionStart - The start time of the session to check.
 * @param newSessionDuration - The duration of the session to check.
 * @param excludeSessionId - An optional ID of a session to exclude from the check (used when editing).
 * @returns The conflicting session object if a conflict is found, otherwise null.
 */
export const isTimeSlotTaken = (
  sessions: Session[],
  newSessionStart: Date,
  newSessionDuration: number,
  excludeSessionId?: string
): Session | null => {
  const newSessionEnd = addMinutes(newSessionStart, newSessionDuration);

  for (const existingSession of sessions) {
    if (existingSession.id === excludeSessionId) {
      continue; // Skip checking against itself when editing
    }

    const existingSessionStart = parseISO(existingSession.date);
    const existingSessionEnd = addMinutes(existingSessionStart, existingSession.durationMinutes);

    // Check for overlap: (StartA < EndB) and (EndA > StartB)
    if (newSessionStart < existingSessionEnd && newSessionEnd > existingSessionStart) {
      return existingSession; // Conflict found
    }
  }

  return null; // No conflict
};

/**
 * Finds all groups of conflicting (overlapping) sessions in a list of sessions.
 * @param sessions - The array of all sessions to check.
 * @returns An array of arrays, where each inner array is a group of conflicting sessions.
 */
export const findSchedulingConflicts = (sessions: Session[]): Session[][] => {
  const sortedSessions = [...sessions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const conflictGroups: Session[][] = [];
  const processedSessionIds = new Set<string>();

  for (let i = 0; i < sortedSessions.length; i++) {
    const sessionA = sortedSessions[i];
    if (processedSessionIds.has(sessionA.id)) continue;

    const startA = new Date(sessionA.date);
    const endA = addMinutes(startA, sessionA.durationMinutes);
    let currentGroup: Session[] | null = null;

    for (let j = i + 1; j < sortedSessions.length; j++) {
      const sessionB = sortedSessions[j];
      if (processedSessionIds.has(sessionB.id)) continue;
      
      const startB = new Date(sessionB.date);
      
      if (startB >= endA) break;

      const endB = addMinutes(startB, sessionB.durationMinutes);
      
      if (startA < endB && endA > startB) {
        if (!currentGroup) {
          currentGroup = [sessionA];
          processedSessionIds.add(sessionA.id);
        }
        currentGroup.push(sessionB);
        processedSessionIds.add(sessionB.id);
      }
    }
    if (currentGroup) {
      conflictGroups.push(currentGroup);
    }
  }
  return conflictGroups;
};