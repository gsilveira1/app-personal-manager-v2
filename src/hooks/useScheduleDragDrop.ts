import React, { useState } from 'react'
import { parseISO } from 'date-fns'
import type { Session } from '../types'

export function useScheduleDragDrop(
  sessions: Session[],
  updateSession: (id: string, data: Partial<Session>) => void
) {
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  const handleDragStart = (e: React.DragEvent, sessionId: string) => {
    e.dataTransfer.setData('sessionId', sessionId)
    setDraggedItemId(sessionId)
  }

  const handleDrop = (e: React.DragEvent, newDate: Date, isDayView: boolean) => {
    e.preventDefault()
    const sessionId = e.dataTransfer.getData('sessionId')
    const session = sessions.find((s) => s.id === sessionId)
    if (session) {
      const finalDate = new Date(newDate)
      if (!isDayView) {
        const originalDate = parseISO(session.date)
        finalDate.setHours(originalDate.getHours())
        finalDate.setMinutes(originalDate.getMinutes())
      }
      updateSession(sessionId, { date: finalDate.toISOString() })
    }
    setDraggedItemId(null)
    setDragOverId(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDragEnd = () => {
    setDraggedItemId(null)
    setDragOverId(null)
  }

  return {
    handleDragStart,
    handleDrop,
    handleDragOver,
    handleDragEnd,
    setDragOverId,
    draggedItemId,
    dragOverId,
  }
}
