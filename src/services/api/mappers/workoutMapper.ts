import type { WorkoutBlockType, WorkoutExercise, WorkoutPlan, WorkoutSheet, WorkoutSheetBlock, WorkoutSheetBody, WorkoutSheetExercise, WorkoutSheetItem } from '../../../types'

/** Rest between blocks the API applies when none is given. */
export const DEFAULT_REST_SECONDS = 60

/** Fewest exercises each block type accepts (the API answers 400 below it). */
const MIN_EXERCISES: Record<WorkoutBlockType, number> = { REGULAR: 1, BISET: 2, TRISET: 3 }

/**
 * A new structure id. Ids match `^[A-Za-z0-9_-]{1,64}$` and only have to be unique
 * inside one sheet; they are generated here so that the client knows them before the
 * server answers and can send them back unchanged on every later edit.
 */
export const newStructureId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

const byOrder = <T extends { orderIndex?: number }>(list: T[]): T[] =>
  list
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => (a.entry.orderIndex ?? a.index) - (b.entry.orderIndex ?? b.index))
    .map(({ entry }) => entry)

/** Largest block type a block with `count` exercises may keep. */
const fitBlockType = (type: WorkoutBlockType, count: number): WorkoutBlockType => {
  if (count >= MIN_EXERCISES[type]) return type
  return count >= MIN_EXERCISES.BISET ? 'BISET' : 'REGULAR'
}

const toExerciseEntry = (exercise: WorkoutSheetExercise, orderIndex: number): WorkoutSheetExercise => ({
  id: exercise.id ?? newStructureId(),
  exerciseId: exercise.exerciseId ?? null,
  exerciseName: exercise.exerciseName,
  gifUrl: exercise.gifUrl ?? null,
  sets: exercise.sets,
  reps: exercise.reps,
  suggestedLoadKg: exercise.suggestedLoadKg ?? null,
  executionNotes: exercise.executionNotes || null,
  isWarmup: exercise.isWarmup ?? false,
  orderIndex,
})

/**
 * Builds the `workouts` list of a sheet write: the whole structure document.
 * Every item, block and exercise keeps the id it has (so pointers held by sessions
 * and execution logs stay valid) or gets a new one; `orderIndex` follows the array
 * order; properties the API does not know (`lastLoadKg`, …) are dropped, since an
 * unknown property is a 400. Blocks left without exercises are removed and a block
 * that lost exercises is downgraded to a type it still satisfies.
 */
export const buildStructure = (items: WorkoutSheetItem[]): WorkoutSheetItem[] =>
  items.map((item, itemIndex) => ({
    id: item.id ?? newStructureId(),
    letter: item.letter,
    name: item.name,
    orderIndex: itemIndex,
    blocks: item.blocks
      .filter((block) => block.exercises.length > 0)
      .map((block, blockIndex) => ({
        id: block.id ?? newStructureId(),
        type: fitBlockType(block.type, block.exercises.length),
        orderIndex: blockIndex,
        restTimeSeconds: block.restTimeSeconds ?? DEFAULT_REST_SECONDS,
        exercises: block.exercises.map(toExerciseEntry),
      })),
  }))

/** Copy of a structure without ids: what a new sheet gets when it starts from a template. */
export const withoutIds = (items: WorkoutSheetItem[]): WorkoutSheetItem[] =>
  byOrder(items).map(({ id: _item, ...item }) => ({
    ...item,
    blocks: byOrder(item.blocks).map(({ id: _block, ...block }) => ({
      ...block,
      exercises: byOrder(block.exercises).map(({ id: _exercise, ...exercise }) => ({ ...exercise })),
    })),
  }))

/** Request body of the sheet and template writes (`SheetBody`). */
export const toSheetBody = (sheet: WorkoutSheetBody): WorkoutSheetBody => {
  const body: WorkoutSheetBody = { name: sheet.name, workouts: buildStructure(sheet.workouts) }
  if (sheet.expiresAt) body.expiresAt = sheet.expiresAt
  if (sheet.description) body.description = sheet.description
  if (sheet.tags) body.tags = sheet.tags
  return body
}

/** Sheet as received: every level sorted by `orderIndex`, missing lists as empty. */
export const toWorkoutSheet = (wire: WorkoutSheet): WorkoutSheet => ({
  ...wire,
  tags: wire.tags ?? [],
  workouts: byOrder(wire.workouts ?? []).map((item) => ({
    ...item,
    blocks: byOrder(item.blocks ?? []).map((block) => ({ ...block, exercises: byOrder(block.exercises ?? []) })),
  })),
})

/** "12.5kg" for the flat editor's free-text load; nothing when no load is suggested. */
const formatLoad = (kg: number | null | undefined): string | undefined => (kg === null || kg === undefined ? undefined : `${kg}kg`)

/** Numeric part of a free-text load ("20kg", "12,5 kg", "bodyweight" → 20, 12.5, null). */
export const parseLoadKg = (weight: string | undefined): number | null => {
  const match = weight?.replace(',', '.').match(/\d+(\.\d+)?/)
  return match ? Number(match[0]) : null
}

/**
 * Template → flat `WorkoutPlan` for the library and the simple editor: `title` is
 * the sheet name and the exercises of every item and block are listed in order.
 * Each exercise remembers where it came from (`ref`) and the plan keeps the original
 * items (`source`), which is what lets `toTemplateBody` rebuild the same structure.
 */
export const toWorkoutPlan = (sheet: WorkoutSheet): WorkoutPlan => {
  const { workouts } = toWorkoutSheet(sheet)
  const exercises: WorkoutExercise[] = []
  for (const item of workouts) {
    for (const block of item.blocks) {
      for (const exercise of block.exercises) {
        const flat: WorkoutExercise = {
          name: exercise.exerciseName,
          sets: exercise.sets,
          reps: exercise.reps,
          weight: formatLoad(exercise.suggestedLoadKg),
          notes: exercise.executionNotes ?? undefined,
          isWarmup: exercise.isWarmup ?? false,
        }
        if (item.id && block.id && exercise.id) flat.ref = { id: exercise.id, itemId: item.id, blockId: block.id }
        exercises.push(flat)
      }
    }
  }
  return {
    id: sheet.id,
    clientId: sheet.clientId ?? undefined,
    title: sheet.name,
    description: sheet.description ?? undefined,
    tags: sheet.tags ?? [],
    exercises,
    createdAt: sheet.createdAt ?? '',
    itemId: workouts[0]?.id,
    source: workouts,
  }
}

const toFlatEntry = (exercise: WorkoutExercise, original?: WorkoutSheetExercise): WorkoutSheetExercise => ({
  id: original?.id,
  exerciseId: original?.exerciseId ?? null,
  gifUrl: original?.gifUrl ?? null,
  exerciseName: exercise.name,
  sets: exercise.sets,
  reps: exercise.reps,
  suggestedLoadKg: parseLoadKg(exercise.weight),
  executionNotes: exercise.notes || null,
  isWarmup: exercise.isWarmup ?? false,
})

/**
 * Flat exercise list → structure items.
 *
 * An exercise that still points (`ref`) at an item and block of `source` goes back
 * into them, keeping their ids, letter, name, block type and rest time. An exercise
 * without a pointer (added in the flat editor) becomes its own REGULAR block in the
 * item of the exercise before it. With no source at all the result is the flat shape
 * the contract defines: one item, letter "A", one REGULAR block per exercise.
 */
export const flatToStructure = (title: string, exercises: WorkoutExercise[], source: WorkoutSheetItem[] = []): WorkoutSheetItem[] => {
  const items: WorkoutSheetItem[] = []
  const itemOf = (origin?: WorkoutSheetItem): WorkoutSheetItem => {
    const found = origin ? items.find((i) => i.id === origin.id) : items[items.length - 1]
    if (found) return found
    const first = origin ?? source[0]
    const created: WorkoutSheetItem = first ? { id: first.id, letter: first.letter, name: first.name, blocks: [] } : { letter: 'A', name: title, blocks: [] }
    items.push(created)
    return created
  }

  for (const exercise of exercises) {
    const srcItem = exercise.ref ? source.find((i) => i.id === exercise.ref?.itemId) : undefined
    const srcBlock = srcItem?.blocks.find((b) => b.id === exercise.ref?.blockId)
    const srcExercise = srcBlock?.exercises.find((e) => e.id === exercise.ref?.id)
    const item = itemOf(srcBlock ? srcItem : undefined)
    let block: WorkoutSheetBlock | undefined = srcBlock ? item.blocks.find((b) => b.id === srcBlock.id) : undefined
    if (!block) {
      block = srcBlock ? { id: srcBlock.id, type: srcBlock.type, restTimeSeconds: srcBlock.restTimeSeconds, exercises: [] } : { type: 'REGULAR', restTimeSeconds: DEFAULT_REST_SECONDS, exercises: [] }
      item.blocks.push(block)
    }
    block.exercises.push(toFlatEntry(exercise, srcExercise))
  }
  return items
}

/** Flat `WorkoutPlan` → body of `POST /workout-templates` / `POST /clients/:id/workout-sheets`. */
export const toTemplateBody = (plan: Pick<WorkoutPlan, 'title' | 'exercises'> & Partial<Pick<WorkoutPlan, 'description' | 'tags' | 'source'>>): WorkoutSheetBody =>
  toSheetBody({
    name: plan.title,
    description: plan.description,
    tags: plan.tags ?? [],
    workouts: flatToStructure(plan.title, plan.exercises, plan.source),
  })

/**
 * Flat partial update → body of `PATCH /workout-sheets/:id`. `workouts` is only sent
 * when the exercises are part of the update, because it replaces the whole structure.
 */
export const toTemplatePatch = (updates: Partial<WorkoutPlan>): Partial<WorkoutSheetBody> => {
  const body: Partial<WorkoutSheetBody> = {}
  if (updates.title !== undefined) body.name = updates.title
  if (updates.description !== undefined) body.description = updates.description
  if (updates.tags !== undefined) body.tags = updates.tags
  if (updates.exercises !== undefined) body.workouts = buildStructure(flatToStructure(updates.title ?? 'Treino A', updates.exercises, updates.source))
  return body
}
