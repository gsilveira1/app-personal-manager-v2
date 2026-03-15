import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useScheduleDragDrop } from './useScheduleDragDrop'
import type { Session } from '../types'

function makeSession(overrides: Partial<Session> & { id: string; date: string }): Session {
  return {
    clientId: 'c1',
    durationMinutes: 60,
    type: 'In-Person',
    category: 'Workout',
    completed: false,
    ...overrides,
  }
}

function createMockDragEvent(overrides: Record<string, unknown> = {}): React.DragEvent {
  const data: Record<string, string> = {}
  return {
    dataTransfer: {
      setData: vi.fn((key: string, value: string) => {
        data[key] = value
      }),
      getData: vi.fn((key: string) => data[key] || ''),
    },
    preventDefault: vi.fn(),
    ...overrides,
  } as unknown as React.DragEvent
}

describe('useScheduleDragDrop', () => {
  let updateSessionMock: ReturnType<typeof vi.fn>

  const sessions: Session[] = [
    makeSession({ id: 's1', date: '2025-06-15T14:30:00.000Z' }),
    makeSession({ id: 's2', date: '2025-06-16T09:00:00.000Z' }),
  ]

  beforeEach(() => {
    updateSessionMock = vi.fn()
  })

  it('initializes with null draggedItemId and dragOverId', () => {
    const { result } = renderHook(() => useScheduleDragDrop(sessions, updateSessionMock))
    expect(result.current.draggedItemId).toBeNull()
    expect(result.current.dragOverId).toBeNull()
  })

  describe('handleDragStart', () => {
    it('sets draggedItemId and calls setData on dataTransfer', () => {
      const { result } = renderHook(() => useScheduleDragDrop(sessions, updateSessionMock))
      const event = createMockDragEvent()

      act(() => {
        result.current.handleDragStart(event, 's1')
      })

      expect(result.current.draggedItemId).toBe('s1')
      expect(event.dataTransfer.setData).toHaveBeenCalledWith('sessionId', 's1')
    })
  })

  describe('handleDrop', () => {
    it('calls updateSession with correct new date', () => {
      const { result } = renderHook(() => useScheduleDragDrop(sessions, updateSessionMock))

      // Simulate drag start to populate dataTransfer
      const startEvent = createMockDragEvent()
      act(() => {
        result.current.handleDragStart(startEvent, 's1')
      })

      // Create drop event that shares the same dataTransfer
      const dropEvent = {
        ...startEvent,
        preventDefault: vi.fn(),
      } as unknown as React.DragEvent

      const newDate = new Date('2025-06-20T08:00:00.000Z')

      act(() => {
        result.current.handleDrop(dropEvent, newDate, true)
      })

      expect(dropEvent.preventDefault).toHaveBeenCalled()
      expect(updateSessionMock).toHaveBeenCalledTimes(1)
      expect(updateSessionMock).toHaveBeenCalledWith('s1', {
        date: expect.any(String),
      })

      // In day view (isDayView = true), the time from newDate is used as-is
      const passedDate = updateSessionMock.mock.calls[0][1].date
      expect(passedDate).toContain('2025-06-20')
    })

    it('preserves original session time when not in day view', () => {
      const { result } = renderHook(() => useScheduleDragDrop(sessions, updateSessionMock))

      const startEvent = createMockDragEvent()
      act(() => {
        result.current.handleDragStart(startEvent, 's1')
      })

      const dropEvent = {
        ...startEvent,
        preventDefault: vi.fn(),
      } as unknown as React.DragEvent

      // Drop on a new date — but original session s1 is at 14:30 UTC
      // The code uses setHours/setMinutes (local time) after parseISO (also local),
      // so we check with local time accessors to be timezone-agnostic
      const newDate = new Date('2025-06-20T00:00:00.000Z')

      act(() => {
        result.current.handleDrop(dropEvent, newDate, false)
      })

      expect(updateSessionMock).toHaveBeenCalledTimes(1)
      const passedDate = new Date(updateSessionMock.mock.calls[0][1].date)
      const originalDate = new Date('2025-06-15T14:30:00.000Z')
      // The code preserves local hours/minutes from the original session
      expect(passedDate.getHours()).toBe(originalDate.getHours())
      expect(passedDate.getMinutes()).toBe(originalDate.getMinutes())
      // The date part comes from newDate
      expect(passedDate.getDate()).toBe(newDate.getDate())
    })

    it('clears draggedItemId and dragOverId after drop', () => {
      const { result } = renderHook(() => useScheduleDragDrop(sessions, updateSessionMock))

      const startEvent = createMockDragEvent()
      act(() => {
        result.current.handleDragStart(startEvent, 's1')
      })

      act(() => {
        result.current.setDragOverId('some-slot')
      })

      const dropEvent = {
        ...startEvent,
        preventDefault: vi.fn(),
      } as unknown as React.DragEvent

      act(() => {
        result.current.handleDrop(dropEvent, new Date(), true)
      })

      expect(result.current.draggedItemId).toBeNull()
      expect(result.current.dragOverId).toBeNull()
    })

    it('does not call updateSession if session is not found', () => {
      const { result } = renderHook(() => useScheduleDragDrop(sessions, updateSessionMock))

      // Create an event with a non-existent session ID
      const data: Record<string, string> = { sessionId: 'non-existent' }
      const dropEvent = {
        dataTransfer: {
          setData: vi.fn(),
          getData: vi.fn((key: string) => data[key] || ''),
        },
        preventDefault: vi.fn(),
      } as unknown as React.DragEvent

      act(() => {
        result.current.handleDrop(dropEvent, new Date(), true)
      })

      expect(updateSessionMock).not.toHaveBeenCalled()
    })
  })

  describe('handleDragOver', () => {
    it('calls preventDefault on the event', () => {
      const { result } = renderHook(() => useScheduleDragDrop(sessions, updateSessionMock))
      const event = createMockDragEvent()

      act(() => {
        result.current.handleDragOver(event)
      })

      expect(event.preventDefault).toHaveBeenCalled()
    })
  })

  describe('handleDragEnd', () => {
    it('clears draggedItemId and dragOverId', () => {
      const { result } = renderHook(() => useScheduleDragDrop(sessions, updateSessionMock))

      // Set some drag state
      act(() => {
        const event = createMockDragEvent()
        result.current.handleDragStart(event, 's1')
      })
      act(() => {
        result.current.setDragOverId('slot-1')
      })

      expect(result.current.draggedItemId).toBe('s1')
      expect(result.current.dragOverId).toBe('slot-1')

      act(() => {
        result.current.handleDragEnd()
      })

      expect(result.current.draggedItemId).toBeNull()
      expect(result.current.dragOverId).toBeNull()
    })
  })

  describe('setDragOverId', () => {
    it('updates dragOverId state', () => {
      const { result } = renderHook(() => useScheduleDragDrop(sessions, updateSessionMock))

      act(() => {
        result.current.setDragOverId('target-slot')
      })

      expect(result.current.dragOverId).toBe('target-slot')
    })
  })
})
