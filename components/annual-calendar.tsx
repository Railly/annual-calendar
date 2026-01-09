"use client"

import { useState, useRef, useMemo, useCallback, useEffect } from "react"
import { ChevronLeft, ChevronRight, Plus, Calendar, Github } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TooltipProvider } from "@/components/ui/tooltip"
import { type CalendarEvent, defaultTags } from "@/lib/calendar-data"
import { useSanityCalendar } from "@/hooks/use-sanity-calendar"
import { EventModal } from "@/components/event-modal"
import { NoteModal } from "@/components/note-modal"
import { PhotoModal } from "@/components/photo-modal"
import { TagFilter } from "@/components/tag-filter"
import { RepoFilter } from "@/components/repo-filter"
import { AIDock } from "@/components/ai-dock"
import { ThemeToggle } from "@/components/theme-toggle"
import { YearView } from "@/components/year-view"
import { GitHubYearView, StatsDialog, getGitHubRepos } from "@/components/github-year-view"
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
  const [dayPhotos, setDayPhotos] = useState<Map<string, string>>(new Map())
  const [dayNotes, setDayNotes] = useState<Map<string, string>>(new Map())
  const [selectedTags, setSelectedTags] = useState<string[]>(defaultTags.map((t) => t.id))
  const [viewMode, setViewMode] = useState<ViewMode>("calendar")
  const [pulsingToday, setPulsingToday] = useState(false)

  const githubRepos = useMemo(() => getGitHubRepos(year), [year])
  const [selectedRepos, setSelectedRepos] = useState<string[]>(() => githubRepos.map((r) => r.name))

  // Update selected repos when year changes
  useEffect(() => {
    const repoNames = githubRepos.map((r) => r.name)
    setSelectedRepos(repoNames)
  }, [githubRepos])

  const { events, tags, isLoading, createEvent, updateEvent, deleteEvent } = useSanityCalendar()

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
      if (editingEvent) {
        const updatedEvent = { ...editingEvent, ...eventData }
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
      if (editingEvent) {
        setLocalEvents((prev) => prev.map((e) => (e.id === editingEvent.id ? { ...editingEvent, ...eventData } : e)))
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
  }

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteEvent(eventId)
    } catch (error) {
      // Continue with local delete
    }
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

  const handleSaveNote = (content: string) => {
    if (selectedDate) {
      const dateKey = getDateKey(selectedDate)
      setDayNotes((prev) => new Map(prev).set(dateKey, content))
    }
    setIsNoteModalOpen(false)
  }

  const handleSavePhoto = (photoUrl: string) => {
    if (selectedDate) {
      const dateKey = getDateKey(selectedDate)
      setDayPhotos((prev) => new Map(prev).set(dateKey, photoUrl))
    }
    setIsPhotoModalOpen(false)
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

  return (
    <TooltipProvider delayDuration={1200}>
      <div className="h-screen flex flex-col bg-background relative">
        {/* Header - Single unified header */}
        <header className="flex-shrink-0 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between px-4 h-12">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrevYear}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-lg font-semibold min-w-[60px] text-center">{year}</span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNextYear}>
                <ChevronRight className="h-4 w-4" />
              </Button>

              {/* Tabs next to year selector */}
              <div className="flex items-center bg-muted rounded-lg p-0.5 ml-2">
                <button
                  onClick={() => setViewMode("calendar")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                    viewMode === "calendar"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  Calendar
                </button>
                <button
                  onClick={() => setViewMode("github")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                    viewMode === "github"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Github className="h-3.5 w-3.5" />
                  GitHub
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {viewMode === "calendar" ? (
                <TagFilter tags={tags} selectedTags={selectedTags} onTagsChange={setSelectedTags} />
              ) : (
                <RepoFilter repos={githubRepos} selectedRepos={selectedRepos} onReposChange={setSelectedRepos} />
              )}

              <ThemeToggle />

              {viewMode === "calendar" ? (
                <Button size="sm" className="h-8 gap-1.5" onClick={() => handleDayClick(new Date())}>
                  <Plus className="h-3.5 w-3.5" />
                  Event
                </Button>
              ) : (
                <StatsDialog year={year} />
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 min-h-0 relative">
          {viewMode === "calendar" ? (
            isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-muted-foreground">Loading calendar...</div>
              </div>
            ) : (
              <YearView
                year={year}
                events={filteredEvents}
                tags={tags}
                dayPhotos={dayPhotos}
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
              />
            )
          ) : (
            <GitHubYearView year={year} selectedRepos={selectedRepos} onReposChange={setSelectedRepos} />
          )}
        </div>

        {/* AI Dock - only for calendar view */}
        {viewMode === "calendar" && (
          <AIDock
            tags={tags}
            onAddEvents={handleAddEventsFromAI}
            onClearAll={handleClearAllEvents}
            onLoadSampleData={handleLoadSampleData}
          />
        )}

        {/* Modals */}
        <EventModal
          isOpen={isEventModalOpen}
          onClose={() => {
            setIsEventModalOpen(false)
            setEditingEvent(null)
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
          existingNote={selectedDate ? dayNotes.get(getDateKey(selectedDate)) : undefined}
        />

        <PhotoModal
          isOpen={isPhotoModalOpen}
          onClose={() => setIsPhotoModalOpen(false)}
          onSave={handleSavePhoto}
          date={selectedDate || new Date()}
        />
      </div>
    </TooltipProvider>
  )
}
