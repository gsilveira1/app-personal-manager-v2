import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, LayoutGrid, List, CalendarDays, Info, Ban } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { type Session, type MaterializedBlock, type AvailabilityBlock } from '../types'
import { useStore } from '../store/store'
import { Card, Button } from '../components/atoms'
import { useScheduleNavigation, type ViewType } from '../hooks/useScheduleNavigation'
import { useScheduleDragDrop } from '../hooks/useScheduleDragDrop'
import { DayView } from '../components/organisms/schedule/DayView'
import { WeekView } from '../components/organisms/schedule/WeekView'
import { MonthView } from '../components/organisms/schedule/MonthView'
import { SessionEditorModal } from '../components/organisms/schedule/SessionEditorModal'
import { SessionDetailsModal } from '../components/organisms/schedule/SessionDetailsModal'
import { OverviewModal } from '../components/organisms/schedule/OverviewModal'
import { BlockEditorModal } from '../components/organisms/schedule/BlockEditorModal'

export const Schedule = () => {
  const { t } = useTranslation('schedule')
  const {
    sessions,
    clients,
    toggleSessionComplete,
    addSession,
    addRecurringSessions,
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

  const viewIcons: Record<ViewType, React.ElementType> = { day: List, week: LayoutGrid, month: CalendarDays }

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
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-slate-900">{t('title')}</h1>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full xl:w-auto">
            <div className="flex bg-slate-100 p-1 rounded-lg sm:mr-2 overflow-x-auto">
              {(['day', 'week', 'month'] as ViewType[]).map((v) => {
                const Icon = viewIcons[v]
                return (
                  <button
                    key={v}
                    onClick={() => nav.setView(v)}
                    className={`flex-1 sm:flex-none px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center justify-center ${nav.view === v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <Icon className="h-4 w-4 mr-1.5" />
                    {t(v).charAt(0).toUpperCase() + t(v).slice(1)}
                  </button>
                )
              })}
            </div>
            <Button variant="outline" onClick={openBlockEditor} className="whitespace-nowrap">
              <Ban className="mr-2 h-4 w-4" />
              {t('blockTime', 'Bloquear')}
            </Button>
            <Button onClick={openNewSession} className="whitespace-nowrap">
              <Plus className="mr-2 h-4 w-4" />
              {t('addSession')}
            </Button>
          </div>
        </div>

        <div
          onClick={() => setIsOverviewModalOpen(true)}
          className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-4 rounded-xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/50 rounded-lg">
              <CalendarIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-sm opacity-90 capitalize flex items-center gap-1.5">
                {t(`overview${nav.view.charAt(0).toUpperCase() + nav.view.slice(1)}`)} <Info className="h-3 w-3 opacity-70" />
              </h3>
              <p className="text-xs text-indigo-100">{nav.getHeaderText()}</p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm w-full sm:w-auto justify-between sm:justify-end">
            {Object.entries(nav.stats).map(([key, value]) => (
              <div key={key} className="flex flex-col items-center sm:items-end">
                <span className="text-indigo-200 text-xs uppercase tracking-wider font-medium">{key}</span>
                <span className="font-bold text-xl">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Card className="p-4 flex items-center justify-between sticky top-0 z-10 shadow-sm border-slate-200">
          <div className="flex items-center gap-2">
            <button onClick={nav.handlePrevious} className="p-2 hover:bg-slate-100 rounded-full">
              <ChevronLeft className="h-5 w-5 text-slate-600" />
            </button>
            <Button variant="outline" onClick={nav.handleToday} className="hidden sm:flex text-xs h-8">
              {t('today')}
            </Button>
          </div>
          <div className="text-base sm:text-lg font-bold text-slate-900 truncate max-w-[200px] sm:max-w-none">{nav.getHeaderText()}</div>
          <button onClick={nav.handleNext} className="p-2 hover:bg-slate-100 rounded-full">
            <ChevronRight className="h-5 w-5 text-slate-600" />
          </button>
        </Card>
        <div className="animate-in fade-in duration-300">{renderView()}</div>
      </div>

      {sessionEditorOpen && (
        <SessionEditorModal
          isOpen={sessionEditorOpen}
          onClose={() => setSessionEditorOpen(false)}
          onSaveNew={addSession}
          onSaveRecurring={addRecurringSessions}
          onSaveRecurringEvent={addRecurringEvent}
          onUpdate={updateSessionWithScope}
          sessionToEdit={editingSession}
          clients={clients}
          sessions={sessions}
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
