import { type WorkoutPlan } from '../../types'
import { toTemplateBody, toTemplatePatch, toWorkoutPlan } from './mappers/workoutMapper'
import { createWorkoutSheet, createWorkoutTemplate, deleteWorkoutSheet, getWorkoutTemplates, updateWorkoutSheet } from './workoutSheetApi'

/**
 * The workout library. It is the trainer's template list, shown as flat plans
 * (see `toWorkoutPlan`): the API has no separate "workout" resource.
 */
export const getWorkouts = async (): Promise<WorkoutPlan[]> => (await getWorkoutTemplates()).map(toWorkoutPlan)

/**
 * Creates a workout from the flat editor. Without a client it is a library template.
 * With `clientId` it is that client's new workout sheet, which becomes the active
 * one (the API deactivates the previous active sheet).
 */
export const createWorkout = async (workout: Omit<WorkoutPlan, 'id' | 'createdAt'>): Promise<WorkoutPlan> => {
  const body = toTemplateBody(workout)
  return toWorkoutPlan(workout.clientId ? await createWorkoutSheet(workout.clientId, body) : await createWorkoutTemplate(body))
}

/**
 * Updates a workout. Structure ids are sent back unchanged for every exercise
 * that was kept, so sessions linked to the workout keep pointing at it.
 */
export const updateWorkout = async (id: string, updates: Partial<WorkoutPlan>): Promise<WorkoutPlan> => toWorkoutPlan(await updateWorkoutSheet(id, toTemplatePatch(updates)))

/**
 * Deletes a workout.
 */
export const deleteWorkout = async (id: string) => deleteWorkoutSheet(id)
