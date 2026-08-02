import { useState, useEffect } from 'react'

import { useTranslation } from 'react-i18next'

import { type Session, type MaterializedBlock, type AvailabilityBlock } from '../../types'
import { useStore } from '../../states/stores/store'
import { Card, Button } from '../../components/atoms'
import { useScheduleNavigation, type ViewType } from '../../hooks/useScheduleNavigation'
import { useScheduleDragDrop } from '../../hooks/useScheduleDragDrop'
import { DayView } from '../../components/organisms/schedule/DayView'
import { WeekView } from '../../components/organisms/schedule/WeekView'
import { MonthView } from '../../components/organisms/schedule/MonthView'
import { SessionEditorModal } from '../../components/organisms/schedule/SessionEditorModal'
import { SessionDetailsModal } from '../../components/organisms/schedule/SessionDetailsModal'
import { OverviewModal } from '../../components/organisms/schedule/OverviewModal'
import { BlockEditorModal } from '../../components/organisms/schedule/BlockEditorModal'
import { ScheduleHeader } from '../../components/organisms/schedule/ScheduleHeader'
import { ScheduleOverviewBanner } from '../../components/organisms/schedule/ScheduleOverviewBanner'
import { ScheduleNavigationPanel } from '../../components/organisms/schedule/ScheduleNavigationPanel'

export const Schedule = () => {
  const { t } = useTranslation('schedule')
  const {
    sessions,
    clients,
    toggleSessionComplete,
    addSession,
    addRecurringEvent,
    fetchSessionsForRange,
    updateSessionWithScope,
    updateSession,
    workouts,
    availabilityBlocks,
    fetchAvailabilityBlocks,
    addAvailabilityBlock,
    updateAvailabilityBlock,
    deleteAvailabilityBlock,
  } = useStore()

  const nav = useScheduleNavigation(sessions, fetchSessionsForRange)
  const dragHandlers = useScheduleDragDrop(sessions, updateSession)

  const [sessionEditorOpen, setSessionEditorOpen] = useState(false)
  const [editingSession, setEditingSession] = useState<Session | null>(null)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [preselectedDate, setPreselectedDate] = useState<Date | null>(null)
  const [isOverviewModalOpen, setIsOverviewModalOpen] = useState(false)
  const [blockEditorOpen, setBlockEditorOpen] = useState(false)
  const [editingBlock, setEditingBlock] = useState<MaterializedBlock | null>(null)

  // Fetch blocks alongside sessions for the current range
  useEffect(() => {
    if (nav.rangeStart && nav.rangeEnd) {
      fetchAvailabilityBlocks(nav.rangeStart, nav.rangeEnd)
    }
  }, [nav.rangeStart, nav.rangeEnd, fetchAvailabilityBlocks])

  const handleEditSession = (session: Session) => {
    setEditingSession(session)
    setSessionEditorOpen(true)
  }
  const openQuickAdd = (date: Date) => {
    setPreselectedDate(date)
    setEditingSession(null)
    setSessionEditorOpen(true)
  }
  const openNewSession = () => {
    setPreselectedDate(null)
    setEditingSession(null)
    setSessionEditorOpen(true)
  }
  const openBlockEditor = () => {
    setEditingBlock(null)
    setBlockEditorOpen(true)
  }
  const handleBlockClick = (block: MaterializedBlock) => {
    setEditingBlock(block)
    setBlockEditorOpen(true)
  }
  const handleBlockSave = async (data: Omit<AvailabilityBlock, 'id'>) => {
    await addAvailabilityBlock(data)
    if (nav.rangeStart && nav.rangeEnd) fetchAvailabilityBlocks(nav.rangeStart, nav.rangeEnd)
  }
  const handleBlockUpdate = async (id: string, data: Partial<AvailabilityBlock>) => {
    await updateAvailabilityBlock(id, data)
    if (nav.rangeStart && nav.rangeEnd) fetchAvailabilityBlocks(nav.rangeStart, nav.rangeEnd)
  }
  const handleBlockDelete = async (id: string) => {
    await deleteAvailabilityBlock(id)
    if (nav.rangeStart && nav.rangeEnd) fetchAvailabilityBlocks(nav.rangeStart, nav.rangeEnd)
  }

  const renderView = () => {
    const commonProps = {
      sessions,
      clients,
      onSessionClick: setSelectedSession,
      onToggleComplete: toggleSessionComplete,
      onAreaClick: openQuickAdd,
      dragHandlers,
      blocks: availabilityBlocks,
      onBlockClick: handleBlockClick,
    }
    switch (nav.view) {
      case 'day':
        return <DayView date={nav.currentDate} {...commonProps} />
      case 'week':
        return <WeekView date={nav.currentDate} {...commonProps} />
      case 'month':
        return (
          <MonthView
            date={nav.currentDate}
            sessions={sessions}
            clients={clients}
            onDayClick={(d: Date) => {
              nav.setCurrentDate(d)
              nav.setView('day')
            }}
            blocks={availabilityBlocks}
          />
        )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6">
        <ScheduleHeader
          view={nav.view}
          onViewChange={nav.setView}
          onOpenBlockEditor={openBlockEditor}
          onOpenNewSession={openNewSession}
        />

        <ScheduleOverviewBanner
          title={t(`overview${nav.view.charAt(0).toUpperCase() + nav.view.slice(1)}`)}
          headerText={nav.getHeaderText()}
          stats={nav.stats}
          onClick={() => setIsOverviewModalOpen(true)}
        />
      </div>

      <div className="space-y-4">
        <ScheduleNavigationPanel
          headerText={nav.getHeaderText()}
          onPrevious={nav.handlePrevious}
          onToday={nav.handleToday}
          onNext={nav.handleNext}
        />
        <div className="animate-in fade-in duration-300">{renderView()}</div>
      </div>

      {sessionEditorOpen && (
        <SessionEditorModal
          isOpen={sessionEditorOpen}
          onClose={() => setSessionEditorOpen(false)}
          onSaveNew={addSession}
          onSaveRecurringEvent={addRecurringEvent}
          onUpdate={updateSessionWithScope}
          sessionToEdit={editingSession}
          clients={clients}
          sessions={sessions}
          blocks={availabilityBlocks}
          initialDate={preselectedDate || nav.currentDate}
        />
      )}
      {selectedSession && (
        <SessionDetailsModal session={selectedSession} clients={clients} workouts={workouts} onClose={() => setSelectedSession(null)} onUpdate={updateSession} onEdit={handleEditSession} />
      )}
      {isOverviewModalOpen && (
        <OverviewModal
          isOpen={isOverviewModalOpen}
          onClose={() => setIsOverviewModalOpen(false)}
          sessions={nav.rangeSessions}
          clients={clients}
          headerText={t(`overview${nav.view.charAt(0).toUpperCase() + nav.view.slice(1)}`)}
          workouts={workouts}
        />
      )}
      {blockEditorOpen && (
        <BlockEditorModal
          isOpen={blockEditorOpen}
          onClose={() => setBlockEditorOpen(false)}
          onSave={handleBlockSave}
          onUpdate={handleBlockUpdate}
          onDelete={handleBlockDelete}
          blockToEdit={editingBlock}
          initialDate={nav.currentDate}
        />
      )}
    </div>
  )
}
