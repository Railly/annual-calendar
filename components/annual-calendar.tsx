"use client"

import { useState, useRef, useMemo, useCallback, useEffect } from "react"
import { ChevronLeft, ChevronRight, Plus, Calendar, Github } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TooltipProvider } from "@/components/ui/tooltip"
import { type CalendarEvent, defaultTags } from "@/lib/calendar-data"
import { useSanityCalendar } from "@/hooks/use-sanity-calendar"
import { useGitHubData } from "@/hooks/use-github-data"
import { EventModal } from "@/components/event-modal"
import { NoteModal } from "@/components/note-modal"
import { PhotoModal } from "@/components/photo-modal"
import { TagFilter } from "@/components/tag-filter"
import { RepoFilter } from "@/components/repo-filter"
import { AIDock } from "@/components/ai-dock"
import { ThemeToggle } from "@/components/theme-toggle"
import { YearView } from "@/components/year-view"
import { GitHubYearView, StatsDialog, getGitHubRepos } from "@/components/github-year-view"
import { IntegrationStatus } from "@/components/integration-status"
import { GitHubOnboardingModal, CalendarOnboardingModal } from "@/components/onboarding-modals"
import { AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

type ViewMode = "calendar" | "github"

function getDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

export function AnnualCalendar() {
  const [year, setYear] = useState(2026)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false)
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>(defaultTags.map((t) => t.id))
  const [viewMode, setViewMode] = useState<ViewMode>("github")
  const [pulsingToday, setPulsingToday] = useState(false)
  const [showGitHubOnboarding, setShowGitHubOnboarding] = useState(true)
  const [showCalendarOnboarding, setShowCalendarOnboarding] = useState(false)

  const {
    githubData,
    repoSessions,
    isUsingMockData,
    lastSynced,
    syncGitHub,
    isSyncing,
    needsSync,
  } = useGitHubData(year)

  const githubRepos = useMemo(() => getGitHubRepos(year), [year])
  const [selectedRepos, setSelectedRepos] = useState<string[]>(() => githubRepos.map((r) => r.name))

  const clearDragSelectionRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const repoNames = githubRepos.map((r) => r.name)
    setSelectedRepos(repoNames)
  }, [githubRepos])

  const {
    events,
    tags,
    notes,
    photos,
    isLoading,
    createEvent,
    updateEvent,
    deleteEvent,
    saveNote,
    savePhoto,
    deletePhoto,
  } = useSanityCalendar()

  const [localEvents, setLocalEvents] = useState<CalendarEvent[]>([])

  const justFinishedDragRef = useRef(false)
  const pendingUpdateRef = useRef<CalendarEvent | null>(null)

  useEffect(() => {
    setLocalEvents(events)
  }, [events])

  const filteredEvents = useMemo(() => {
    return localEvents.filter((event) => selectedTags.includes(event.tag))
  }, [localEvents, selectedTags])

  const handlePrevYear = () => setYear((y) => y - 1)
  const handleNextYear = () => setYear((y) => y + 1)

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
    if (mode === "github") {
      setShowGitHubOnboarding(true)
    } else {
      setShowCalendarOnboarding(true)
    }
  }

  const handleDayClick = (date: Date) => {
    setSelectedDate(date)
    setEditingEvent(null)
    setIsEventModalOpen(true)
  }

  const handleEventClick = (event: CalendarEvent) => {
    if (justFinishedDragRef.current) return
    setEditingEvent(event)
    setSelectedDate(event.startDate)
    setIsEventModalOpen(true)
  }

  const handleAddNote = (date: Date) => {
    setSelectedDate(date)
    setIsNoteModalOpen(true)
  }

  const handleAddPhoto = (date: Date) => {
    setSelectedDate(date)
    setIsPhotoModalOpen(true)
  }

  const handleSaveEvent = async (eventData: Omit<CalendarEvent, "id"> & { id?: string }) => {
    try {
      if (editingEvent && eventData.id) {
        const updatedEvent = { ...eventData, id: eventData.id } as CalendarEvent
        await updateEvent(updatedEvent)
        setLocalEvents((prev) => prev.map((e) => (e.id === editingEvent.id ? updatedEvent : e)))
      } else {
        const newEvent = await createEvent(eventData)
        const fullEvent: CalendarEvent = {
          id: newEvent.id || Date.now().toString(),
          ...eventData,
        }
        setLocalEvents((prev) => [...prev, fullEvent])
      }
    } catch (error) {
      console.error("Error saving event:", error)
      if (editingEvent && eventData.id) {
        setLocalEvents((prev) =>
          prev.map((e) => (e.id === editingEvent.id ? ({ ...eventData, id: eventData.id } as CalendarEvent) : e)),
        )
      } else {
        const newEvent: CalendarEvent = {
          id: Date.now().toString(),
          ...eventData,
        }
        setLocalEvents((prev) => [...prev, newEvent])
      }
    }
    setIsEventModalOpen(false)
    setEditingEvent(null)
    clearDragSelectionRef.current?.()
  }

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteEvent(eventId)
    } catch (error) {}
    setLocalEvents((prev) => prev.filter((e) => e.id !== eventId))
    setIsEventModalOpen(false)
    setEditingEvent(null)
  }

  const handleDuplicateEvent = async (event: CalendarEvent) => {
    const duplicatedEvent = {
      title: `${event.title} (copy)`,
      description: event.description,
      startDate: event.startDate,
      endDate: event.endDate,
      tag: event.tag,
    }
    try {
      const newEvent = await createEvent(duplicatedEvent)
      setLocalEvents((prev) => [...prev, { ...duplicatedEvent, id: newEvent.id || Date.now().toString() }])
    } catch (error) {
      setLocalEvents((prev) => [...prev, { ...duplicatedEvent, id: Date.now().toString() }])
    }
  }

  const handleChangeTag = async (event: CalendarEvent, newTagId: string) => {
    const updatedEvent = { ...event, tag: newTagId }
    try {
      await updateEvent(updatedEvent)
    } catch (error) {}
    setLocalEvents((prev) => prev.map((e) => (e.id === event.id ? updatedEvent : e)))
  }

  const handleExtendDay = async (event: CalendarEvent) => {
    const newEndDate = new Date(event.endDate)
    newEndDate.setDate(newEndDate.getDate() + 1)
    const updatedEvent = { ...event, endDate: newEndDate }
    try {
      await updateEvent(updatedEvent)
    } catch (error) {}
    setLocalEvents((prev) => prev.map((e) => (e.id === event.id ? updatedEvent : e)))
  }

  const handleShortenDay = async (event: CalendarEvent) => {
    const newEndDate = new Date(event.endDate)
    newEndDate.setDate(newEndDate.getDate() - 1)
    if (newEndDate >= event.startDate) {
      const updatedEvent = { ...event, endDate: newEndDate }
      try {
        await updateEvent(updatedEvent)
      } catch (error) {}
      setLocalEvents((prev) => prev.map((e) => (e.id === event.id ? updatedEvent : e)))
    }
  }

  const handleUpdateEventLocal = useCallback((event: CalendarEvent) => {
    pendingUpdateRef.current = event
    setLocalEvents((prev) => prev.map((e) => (e.id === event.id ? event : e)))
  }, [])

  const commitPendingUpdate = useCallback(async () => {
    if (pendingUpdateRef.current) {
      const eventToCommit = pendingUpdateRef.current
      pendingUpdateRef.current = null
      try {
        await updateEvent(eventToCommit)
      } catch (error) {
        console.error("Error saving event:", error)
      }
    }
  }, [updateEvent])

  const handleSavePhoto = async (photoUrl: string) => {
    if (selectedDate) {
      const dateKey = getDateKey(selectedDate)
      try {
        await savePhoto(dateKey, photoUrl)
      } catch (error) {
        console.error("Error saving photo:", error)
      }
    }
    setIsPhotoModalOpen(false)
  }

  const handleSaveNote = async (content: string) => {
    if (selectedDate) {
      const dateKey = getDateKey(selectedDate)
      try {
        await saveNote(dateKey, content)
      } catch (error) {
        console.error("Error saving note:", error)
      }
    }
    setIsNoteModalOpen(false)
  }

  const handleAddEventsFromAI = async (newEvents: Omit<CalendarEvent, "id">[]) => {
    for (const eventData of newEvents) {
      try {
        const newEvent = await createEvent(eventData)
        setLocalEvents((prev) => [...prev, { ...eventData, id: newEvent.id || Date.now().toString() }])
      } catch (error) {
        setLocalEvents((prev) => [...prev, { ...eventData, id: Date.now().toString() }])
      }
    }
  }

  const handleClearAllEvents = async () => {
    if (!confirm("Are you sure you want to delete all events? This cannot be undone.")) return

    for (const event of localEvents) {
      try {
        await deleteEvent(event.id)
      } catch (error) {
        console.error("Error deleting event:", error)
      }
    }
    setLocalEvents([])
  }

  const handleLoadSampleData = async () => {
    const { sampleEvents } = await import("@/lib/sample-events")
    for (const eventData of sampleEvents) {
      try {
        const newEvent = await createEvent(eventData)
        setLocalEvents((prev) => [...prev, { ...eventData, id: newEvent.id || Date.now().toString() }])
      } catch (error) {
        setLocalEvents((prev) => [...prev, { ...eventData, id: Date.now().toString() }])
      }
    }
  }

  const handleRemovePhoto = async () => {
    if (selectedDate) {
      const dateKey = getDateKey(selectedDate)
      await deletePhoto(dateKey)
    }
  }

  const handleCreateEventFromDrag = useCallback(
    (startDate: Date, endDate: Date) => {
      setSelectedDate(startDate)
      setEditingEvent({
        id: "",
        title: "",
        description: "",
        startDate,
        endDate,
        tag: tags[0]?.id || "default",
      } as CalendarEvent)
      setIsEventModalOpen(true)
    },
    [tags],
  )

  return (
    <TooltipProvider delayDuration={1200}>
      <div className="h-screen flex flex-col bg-background relative">
        <header className="flex-shrink-0 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between px-3 h-8">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={handlePrevYear}>
                <ChevronLeft className="h-2.5 w-2.5" />
              </Button>
              <span className="text-xs font-semibold min-w-[40px] text-center">{year}</span>
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={handleNextYear}>
                <ChevronRight className="h-2.5 w-2.5" />
              </Button>

              <div className="flex items-center bg-muted rounded p-0.5 ml-1.5">
                <button
                  onClick={() => handleViewModeChange("calendar")}
                  className={cn(
                    "flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-all",
                    viewMode === "calendar"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Calendar className="h-2.5 w-2.5" />
                  Calendar
                </button>
                <button
                  onClick={() => handleViewModeChange("github")}
                  className={cn(
                    "flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-all",
                    viewMode === "github"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Github className="h-2.5 w-2.5" />
                  GitHub
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {viewMode === "calendar" ? (
                <TagFilter tags={tags} selectedTags={selectedTags} onTagsChange={setSelectedTags} />
              ) : (
                <RepoFilter repos={githubRepos} selectedRepos={selectedRepos} onReposChange={setSelectedRepos} />
              )}

              <ThemeToggle />

              <IntegrationStatus 
                onGitHubSync={syncGitHub}
                lastGitHubSync={lastSynced}
                isGitHubSyncing={isSyncing}
              />

              {viewMode === "calendar" ? (
                <Button size="sm" className="h-5 gap-1 text-[10px] px-1.5" onClick={() => handleDayClick(new Date())}>
                  <Plus className="h-2.5 w-2.5" />
                  Event
                </Button>
              ) : (
                <StatsDialog 
                    year={year}
                    githubData={githubData}
                    isUsingMockData={isUsingMockData}
                    lastSynced={lastSynced}
                    onSync={syncGitHub}
                    isSyncing={isSyncing}
                  />
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 min-h-0 relative flex flex-col">
          {viewMode === "calendar" && (
            <div className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700 flex-shrink-0">
              <AlertCircle className="h-4 w-4 text-zinc-500 dark:text-zinc-400 flex-shrink-0" />
              <span className="text-xs text-zinc-600 dark:text-zinc-400">
                Google App under review. For now, only GitHub is working. Calendar events shown are public demo data.
              </span>
            </div>
          )}
          {viewMode === "calendar" ? (
            isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-muted-foreground text-sm">Loading calendar...</div>
              </div>
            ) : (
              <YearView
                year={year}
                events={filteredEvents}
                tags={tags}
                dayPhotos={photos}
                dayNotes={notes}
                onDayClick={handleDayClick}
                onAddNote={handleAddNote}
                onAddPhoto={handleAddPhoto}
                onEventClick={handleEventClick}
                onDeleteEvent={handleDeleteEvent}
                onDuplicateEvent={handleDuplicateEvent}
                onChangeTag={handleChangeTag}
                onExtendDay={handleExtendDay}
                onShortenDay={handleShortenDay}
                onUpdateEvent={handleUpdateEventLocal}
                onCommitUpdate={commitPendingUpdate}
                pulsingToday={pulsingToday}
                onCreateEventFromDrag={handleCreateEventFromDrag}
                clearDragSelectionRef={clearDragSelectionRef}
              />
            )
          ) : (
            <GitHubYearView 
                  year={year} 
                  selectedRepos={selectedRepos} 
                  onReposChange={setSelectedRepos}
                  githubData={githubData}
                  repoSessions={repoSessions}
                  isUsingMockData={isUsingMockData}
                  lastSynced={lastSynced}
                  onSync={syncGitHub}
                  isSyncing={isSyncing}
                />
          )}
        </div>

        {viewMode === "calendar" && (
          <AIDock
            tags={tags}
            onAddEvents={handleAddEventsFromAI}
            onClearAll={handleClearAllEvents}
            onLoadSampleData={handleLoadSampleData}
          />
        )}

        <EventModal
          isOpen={isEventModalOpen}
          onClose={() => {
            setIsEventModalOpen(false)
            setEditingEvent(null)
            clearDragSelectionRef.current?.()
          }}
          onSave={handleSaveEvent}
          onDelete={editingEvent ? () => handleDeleteEvent(editingEvent.id) : undefined}
          event={editingEvent}
          defaultDate={selectedDate || new Date()}
          tags={tags}
        />

        <NoteModal
          isOpen={isNoteModalOpen}
          onClose={() => setIsNoteModalOpen(false)}
          onSave={handleSaveNote}
          date={selectedDate || new Date()}
          existingNote={selectedDate ? notes.get(getDateKey(selectedDate)) : undefined}
        />

        <PhotoModal
          isOpen={isPhotoModalOpen}
          onClose={() => setIsPhotoModalOpen(false)}
          onSave={handleSavePhoto}
          onRemove={handleRemovePhoto}
          date={selectedDate}
          existingPhoto={selectedDate ? photos.get(getDateKey(selectedDate)) : undefined}
        />

        <GitHubOnboardingModal open={showGitHubOnboarding} onOpenChange={setShowGitHubOnboarding} />
        <CalendarOnboardingModal open={showCalendarOnboarding} onOpenChange={setShowCalendarOnboarding} />
      </div>
    </TooltipProvider>
  )
}
