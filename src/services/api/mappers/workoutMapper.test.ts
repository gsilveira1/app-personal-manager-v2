// @vitest-environment node
import { describe, it, expect } from 'vitest'

import type { WorkoutSheet, WorkoutSheetItem } from '../../../types'
import { buildStructure, flatToStructure, parseLoadKg, toSheetBody, toTemplateBody, toTemplatePatch, toWorkoutPlan, toWorkoutSheet, withoutIds } from './workoutMapper'

const ID = /^[A-Za-z0-9_-]{1,64}$/

const allIds = (items: WorkoutSheetItem[]) => items.flatMap((item) => [item.id, ...item.blocks.flatMap((block) => [block.id, ...block.exercises.map((e) => e.id)])])

/** A template with two items, a bi-set and out-of-order `orderIndex` values, as the API could send it. */
const template = (): WorkoutSheet => ({
  id: 'tpl-1',
  name: 'ABC Hipertrofia',
  expiresAt: null,
  active: true,
  isTemplate: true,
  clientId: null,
  userId: 'user-1',
  description: 'Intermediário',
  tags: ['hipertrofia'],
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
  workouts: [
    {
      id: 'item-b',
      letter: 'B',
      name: 'Costas',
      orderIndex: 1,
      blocks: [
        {
          id: 'blk-3',
          type: 'REGULAR',
          orderIndex: 0,
          restTimeSeconds: 45,
          exercises: [
            {
              id: 'ex-4',
              exerciseId: null,
              exerciseName: 'Remada',
              gifUrl: null,
              sets: 4,
              reps: '10',
              suggestedLoadKg: null,
              executionNotes: null,
              isWarmup: false,
              orderIndex: 0,
            },
          ],
        },
      ],
    },
    {
      id: 'item-a',
      letter: 'A',
      name: 'Peito',
      orderIndex: 0,
      blocks: [
        {
          id: 'blk-2',
          type: 'BISET',
          orderIndex: 1,
          restTimeSeconds: 90,
          exercises: [
            {
              id: 'ex-3',
              exerciseId: 'cat-9',
              exerciseName: 'Crucifixo',
              gifUrl: 'https://cdn/c.gif',
              sets: 3,
              reps: '12',
              suggestedLoadKg: 12.5,
              executionNotes: 'Lento',
              isWarmup: false,
              orderIndex: 1,
            },
            {
              id: 'ex-2',
              exerciseId: null,
              exerciseName: 'Flexão',
              gifUrl: null,
              sets: 3,
              reps: '15',
              suggestedLoadKg: null,
              executionNotes: null,
              isWarmup: false,
              orderIndex: 0,
            },
          ],
        },
        {
          id: 'blk-1',
          type: 'REGULAR',
          orderIndex: 0,
          restTimeSeconds: 60,
          exercises: [
            {
              id: 'ex-1',
              exerciseId: null,
              exerciseName: 'Supino',
              gifUrl: null,
              sets: 4,
              reps: '8-10',
              suggestedLoadKg: 40,
              executionNotes: null,
              isWarmup: true,
              orderIndex: 0,
            },
          ],
        },
      ],
    },
  ],
})

describe('buildStructure (the `workouts` document of a sheet write)', () => {
  it('gives every item, block and exercise a unique, contract-shaped id when none is set', () => {
    const built = buildStructure([
      {
        letter: 'A',
        name: 'Peito',
        blocks: [
          {
            type: 'REGULAR',
            restTimeSeconds: 60,
            exercises: [{ exerciseName: 'Supino', sets: 4, reps: '8-10', suggestedLoadKg: 40 }],
          },
          {
            type: 'REGULAR',
            restTimeSeconds: 60,
            exercises: [{ exerciseName: 'Crucifixo', sets: 3, reps: '12' }],
          },
        ],
      },
    ])

    const ids = allIds(built)
    expect(ids).toHaveLength(5)
    for (const id of ids) expect(id).toMatch(ID)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('sends existing ids back unchanged, so session and execution pointers stay valid', () => {
    const source = toWorkoutSheet(template()).workouts

    expect(allIds(buildStructure(source))).toEqual(allIds(source))
  })

  it('numbers orderIndex by array position at every level', () => {
    const built = buildStructure(toWorkoutSheet(template()).workouts)

    expect(built.map((i) => [i.letter, i.orderIndex])).toEqual([
      ['A', 0],
      ['B', 1],
    ])
    expect(built[0].blocks.map((b) => [b.id, b.orderIndex])).toEqual([
      ['blk-1', 0],
      ['blk-2', 1],
    ])
    expect(built[0].blocks[1].exercises.map((e) => [e.id, e.orderIndex])).toEqual([
      ['ex-2', 0],
      ['ex-3', 1],
    ])
  })

  it('drops properties the API does not accept and fills the nullable ones', () => {
    const [item] = buildStructure([
      {
        letter: 'A',
        name: 'Peito',
        blocks: [
          {
            type: 'REGULAR',
            restTimeSeconds: 60,
            exercises: [{ exerciseName: 'Supino', sets: 4, reps: '8', lastLoadKg: 30, workoutExerciseId: 'x' } as never],
          },
        ],
      },
    ])

    const exercise = item.blocks[0].exercises[0]
    expect(Object.keys(exercise).sort()).toEqual(['executionNotes', 'exerciseId', 'exerciseName', 'gifUrl', 'id', 'isWarmup', 'orderIndex', 'reps', 'sets', 'suggestedLoadKg'])
    expect(exercise).toMatchObject({
      exerciseId: null,
      gifUrl: null,
      suggestedLoadKg: null,
      executionNotes: null,
      isWarmup: false,
    })
  })

  it('downgrades a block that no longer has enough exercises for its type, and removes an empty one', () => {
    const exercise = (name: string) => ({ exerciseName: name, sets: 3, reps: '10' })
    const [item] = buildStructure([
      {
        letter: 'A',
        name: 'A',
        blocks: [
          { type: 'TRISET', restTimeSeconds: 90, exercises: [exercise('a'), exercise('b')] },
          { type: 'BISET', restTimeSeconds: 90, exercises: [exercise('c')] },
          { type: 'BISET', restTimeSeconds: 90, exercises: [] },
          { type: 'TRISET', restTimeSeconds: 90, exercises: [exercise('d'), exercise('e'), exercise('f')] },
        ],
      },
    ])

    expect(item.blocks.map((b) => b.type)).toEqual(['BISET', 'REGULAR', 'TRISET'])
  })
})

describe('toSheetBody', () => {
  it('sends name, structure and only the optional keys that have a value', () => {
    const body = toSheetBody({
      name: 'Ficha',
      workouts: [],
      description: '',
      expiresAt: '2026-11-01T00:00:00.000Z',
    })

    expect(body).toEqual({ name: 'Ficha', workouts: [], expiresAt: '2026-11-01T00:00:00.000Z' })
  })
})

describe('withoutIds (new sheet started from a template)', () => {
  it('copies the content in order and leaves every id out', () => {
    const copy = withoutIds(template().workouts)

    expect(allIds(copy).every((id) => id === undefined)).toBe(true)
    expect(copy.map((i) => i.letter)).toEqual(['A', 'B'])
    expect(copy[0].blocks[1].exercises.map((e) => e.exerciseName)).toEqual(['Flexão', 'Crucifixo'])
  })
})

describe('parseLoadKg', () => {
  it.each([
    ['20kg', 20],
    ['12,5 kg', 12.5],
    ['7.5', 7.5],
    ['bodyweight', null],
    ['', null],
    [undefined, null],
  ])('%s → %s', (weight, expected) => {
    expect(parseLoadKg(weight)).toBe(expected)
  })
})

describe('toWorkoutPlan (template → flat library entry)', () => {
  it('reads the structure document into the flat view in orderIndex order', () => {
    const plan = toWorkoutPlan(template())

    expect(plan).toMatchObject({
      id: 'tpl-1',
      title: 'ABC Hipertrofia',
      description: 'Intermediário',
      tags: ['hipertrofia'],
      createdAt: '2026-09-01T00:00:00.000Z',
      itemId: 'item-a',
    })
    expect(plan.clientId).toBeUndefined()
    expect(plan.exercises.map((e) => e.name)).toEqual(['Supino', 'Flexão', 'Crucifixo', 'Remada'])
    expect(plan.exercises[0]).toEqual({
      name: 'Supino',
      sets: 4,
      reps: '8-10',
      weight: '40kg',
      notes: undefined,
      isWarmup: true,
      ref: { id: 'ex-1', itemId: 'item-a', blockId: 'blk-1' },
    })
    expect(plan.exercises[2]).toMatchObject({
      weight: '12.5kg',
      notes: 'Lento',
      ref: { id: 'ex-3', itemId: 'item-a', blockId: 'blk-2' },
    })
    expect(plan.exercises[3].weight).toBeUndefined()
  })
})

describe('flat plan → structure', () => {
  it('builds the flat shape of the contract for a new workout: one item "A", one REGULAR block per exercise', () => {
    const body = toTemplateBody({
      title: 'Full Body',
      description: 'Base',
      tags: ['força'],
      exercises: [
        { name: 'Agachamento', sets: 3, reps: '8-10', weight: '60kg', notes: 'Profundo', isWarmup: false },
        { name: 'Prancha', sets: 3, reps: '60s', isWarmup: true },
      ],
    })

    expect(body).toMatchObject({ name: 'Full Body', description: 'Base', tags: ['força'] })
    expect(body.workouts).toHaveLength(1)
    expect(body.workouts[0]).toMatchObject({ letter: 'A', name: 'Full Body', orderIndex: 0 })
    expect(body.workouts[0].blocks.map((b) => [b.type, b.orderIndex, b.restTimeSeconds, b.exercises.length])).toEqual([
      ['REGULAR', 0, 60, 1],
      ['REGULAR', 1, 60, 1],
    ])
    expect(body.workouts[0].blocks[0].exercises[0]).toMatchObject({
      exerciseName: 'Agachamento',
      sets: 3,
      reps: '8-10',
      suggestedLoadKg: 60,
      executionNotes: 'Profundo',
      isWarmup: false,
    })
    expect(body.workouts[0].blocks[1].exercises[0]).toMatchObject({
      exerciseName: 'Prancha',
      suggestedLoadKg: null,
      executionNotes: null,
      isWarmup: true,
    })
    for (const id of allIds(body.workouts)) expect(id).toMatch(ID)
  })

  it('round-trips a structured template without losing ids, items, block types or rest times', () => {
    const plan = toWorkoutPlan(template())

    const rebuilt = buildStructure(flatToStructure(plan.title, plan.exercises, plan.source))

    expect(rebuilt).toEqual(buildStructure(toWorkoutSheet(template()).workouts))
  })

  it('keeps the ids of the exercises that stay when one is edited, one removed and one added', () => {
    const plan = toWorkoutPlan(template())
    const [supino, flexao, , remada] = plan.exercises
    const edited = [{ ...supino, sets: 5, weight: '45kg' }, flexao, { name: 'Tríceps', sets: 3, reps: '12' }, remada]

    const patch = toTemplatePatch({ ...plan, exercises: edited })
    const [itemA, itemB] = patch.workouts!

    expect(patch.name).toBe('ABC Hipertrofia')
    expect([itemA.id, itemB.id]).toEqual(['item-a', 'item-b'])
    // Supino keeps its ids and takes the edit
    expect(itemA.blocks[0]).toMatchObject({ id: 'blk-1', type: 'REGULAR', restTimeSeconds: 60 })
    expect(itemA.blocks[0].exercises[0]).toMatchObject({ id: 'ex-1', sets: 5, suggestedLoadKg: 45 })
    // the bi-set lost Crucifixo: it keeps its id but can no longer be a BISET
    expect(itemA.blocks[1]).toMatchObject({ id: 'blk-2', type: 'REGULAR', restTimeSeconds: 90 })
    expect(itemA.blocks[1].exercises.map((e) => e.id)).toEqual(['ex-2'])
    // the new exercise is its own block in the item of the exercise before it, with fresh ids
    expect(itemA.blocks[2].exercises[0]).toMatchObject({ exerciseName: 'Tríceps', exerciseId: null })
    expect(itemA.blocks[2].id).toMatch(ID)
    expect(['blk-1', 'blk-2', 'blk-3']).not.toContain(itemA.blocks[2].id)
    expect(itemB.blocks[0].exercises[0].id).toBe('ex-4')
    // catalogue data the flat editor never shows is carried over
    expect(toTemplatePatch(plan).workouts![0].blocks[1].exercises[1]).toMatchObject({
      id: 'ex-3',
      exerciseId: 'cat-9',
      gifUrl: 'https://cdn/c.gif',
    })
  })

  it('does not send the structure when the update leaves the exercises alone', () => {
    expect(toTemplatePatch({ title: 'Novo nome', tags: ['x'] })).toEqual({ name: 'Novo nome', tags: ['x'] })
  })
})
