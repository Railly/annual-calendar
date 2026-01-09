"use client"

import type React from "react"

import { useState, useRef, useMemo, useCallback, useEffect } from "react"
import { ChevronLeft, ChevronRight, FileText, ImageIcon, Plus, Code } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TooltipProvider } from "@/components/ui/tooltip"
import { type CalendarEvent, type EventTag, defaultTags } from "@/lib/calendar-data"
import { useSanityCalendar } from "@/hooks/use-sanity-calendar"
import { EventModal } from "@/components/event-modal"
import { NoteModal } from "@/components/note-modal"
import { PhotoModal } from "@/components/photo-modal"
import { EventTooltip } from "@/components/event-tooltip"
import { EventContextMenu } from "@/components/event-context-menu"
import { TagFilter } from "@/components/tag-filter"
import { AIDock } from "@/components/ai-dock"
import { DevModeOverlay } from "@/components/dev-mode-overlay"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]
const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]
const WEEK_DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]

const TAG_COLORS: Record<string, { bg: string; text: string; border: string; darkBg: string }> = {
  orange: { bg: "bg-orange-500", text: "text-white", border: "border-orange-500", darkBg: "dark:bg-orange-600/80" },
  teal: { bg: "bg-teal-500", text: "text-white", border: "border-teal-500", darkBg: "dark:bg-teal-600/80" },
  purple: { bg: "bg-purple-500", text: "text-white", border: "border-purple-500", darkBg: "dark:bg-purple-600/80" },
  green: { bg: "bg-emerald-500", text: "text-white", border: "border-emerald-500", darkBg: "dark:bg-emerald-600/80" },
  pink: { bg: "bg-pink-500", text: "text-white", border: "border-pink-500", darkBg: "dark:bg-pink-600/80" },
  blue: { bg: "bg-blue-500", text: "text-white", border: "border-blue-500", darkBg: "dark:bg-blue-600/80" },
  yellow: {
    bg: "bg-amber-400",
    text: "text-amber-900",
    border: "border-amber-400",
    darkBg: "dark:bg-amber-500/80 dark:text-amber-100",
  },
  red: { bg: "bg-red-500", text: "text-white", border: "border-red-500", darkBg: "dark:bg-red-600/80" },
}

function getEventColor(event: CalendarEvent, tags: EventTag[]) {
  const tag = tags.find((t) => t.id === event.tag)
  return TAG_COLORS[tag?.color || "blue"] || TAG_COLORS.blue
}

function isPastDay(date: Date) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const checkDate = new Date(date)
  checkDate.setHours(0, 0, 0, 0)
  return checkDate < today
}

function getWeeksByMonth(year: number) {
  const months: { month: number; weeks: { date: Date; dayOfMonth: number; dayOfWeek: number }[][] }[] = []

  for (let month = 0; month < 12; month++) {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const weeks: { date: Date; dayOfMonth: number; dayOfWeek: number }[][] = []

    let currentWeek: { date: Date; dayOfMonth: number; dayOfWeek: number }[] = []
    const firstDayOfWeek = (firstDay.getDay() + 6) % 7

    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push(null as any)
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day)
      const dayOfWeek = date.getDay()

      currentWeek.push({ date, dayOfMonth: day, dayOfWeek })

      if (dayOfWeek === 0) {
        weeks.push(currentWeek)
        currentWeek = []
      }
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null as any)
      }
      weeks.push(currentWeek)
    }

    months.push({ month, weeks })
  }

  return months
}

function isSameDay(d1: Date, d2: Date) {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate()
}

function isToday(date: Date) {
  return isSameDay(date, new Date())
}

function getDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function DayView({
  year,
  month,
  day,
  events,
  tags,
  dayPhotos,
  dayNotes,
  onDayClick,
  onEventClick,
  onDeleteEvent,
}: {
  year: number
  month: number
  day: number
  events: CalendarEvent[]
  tags: EventTag[]
  dayPhotos: Map<string, string>
  dayNotes: Map<string, string>
  onDayClick: (date: Date) => void
  onEventClick: (event: CalendarEvent) => void
  onDeleteEvent: (eventId: string) => void
}) {
  const currentDate = new Date(year, month, day)
  const dayOfWeek = currentDate.getDay()
  const dateKey = getDateKey(currentDate)
  const photo = dayPhotos.get(dateKey)
  const note = dayNotes.get(dateKey)

  const dayEvents = events.filter((event) => {
    const eventStart = new Date(event.startDate)
    const eventEnd = new Date(event.endDate)
    return currentDate >= eventStart && currentDate <= eventEnd
  })

  const hours = Array.from({ length: 24 }, (_, i) => i)

  return (
    <div
      className="flex-1 overflow-auto p-6"
      style={
        photo
          ? {
              backgroundImage: `linear-gradient(rgba(255,255,255,0.9), rgba(255,255,255,0.9)), url(${photo})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 text-center">
          <h2 className="text-5xl font-bold text-foreground">{day}</h2>
          <p className="text-xl text-muted-foreground mt-1">
            {DAYS[dayOfWeek]}, {new Date(year, month).toLocaleDateString("en-US", { month: "long" })} {year}
          </p>
        </div>

        {note && (
          <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">Journal Entry</p>
            <p className="text-sm text-amber-900 dark:text-amber-100">{note}</p>
          </div>
        )}

        {dayEvents.length > 0 && (
          <div className="mb-6 space-y-2">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">All Day Events</p>
            {dayEvents.map((event) => {
              const colors = getEventColor(event, tags)
              return (
                <EventContextMenu key={event.id} event={event} onEdit={onEventClick} onDelete={onDeleteEvent}>
                  <div
                    className={cn(
                      "px-4 py-3 rounded-lg text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity",
                      colors.bg,
                      colors.darkBg,
                      colors.text,
                    )}
                    onClick={() => onEventClick(event)}
                  >
                    <span className="font-semibold">{event.title}</span>
                    {event.description && <p className="text-xs mt-1 opacity-90">{event.description}</p>}
                  </div>
                </EventContextMenu>
              )
            })}
          </div>
        )}

        <div className="border border-border rounded-lg overflow-hidden">
          {hours.map((hour) => (
            <div
              key={hour}
              onClick={() => onDayClick(currentDate)}
              className="flex border-b border-border/50 last:border-b-0 hover:bg-muted/30 cursor-pointer transition-colors"
            >
              <div className="w-20 py-3 px-3 text-xs text-muted-foreground text-right border-r border-border/50 flex-shrink-0">
                {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}
              </div>
              <div className="flex-1 min-h-[48px]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function WeekView({
  year,
  events,
  tags,
  dayPhotos,
  onDayClick,
  onAddNote,
  onAddPhoto,
  onEventClick,
  onDeleteEvent,
  pulsingToday,
}: {
  year: number
  events: CalendarEvent[]
  tags: EventTag[]
  dayPhotos: Map<string, string>
  onDayClick: (date: Date) => void
  onAddNote: (date: Date) => void
  onAddPhoto: (date: Date) => void
  onEventClick: (event: CalendarEvent) => void
  onDeleteEvent: (eventId: string) => void
  pulsingToday?: boolean
}) {
  const monthsData = useMemo(() => getWeeksByMonth(year), [year])
  const scrollRef = useRef<HTMLDivElement>(null)

  const getEventsForDay = (date: Date) => {
    return events.filter((event) => {
      const eventStart = new Date(event.startDate)
      const eventEnd = new Date(event.endDate)
      return date >= eventStart && date <= eventEnd
    })
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-auto">
      <div className="min-w-[900px]">
        <div className="sticky top-0 z-10 bg-background border-b border-border">
          <div className="grid grid-cols-[60px_repeat(7,1fr)]">
            <div className="h-12" />
            {WEEK_DAYS.map((day, i) => (
              <div
                key={day}
                className={cn(
                  "h-12 flex items-center justify-center text-sm font-semibold border-l border-border",
                  i >= 5 ? "weekend-day text-muted-foreground" : "text-muted-foreground",
                )}
              >
                {day}
              </div>
            ))}
          </div>
        </div>

        {monthsData.map(({ month, weeks }) => (
          <div key={month} className="relative flex">
            <div className="w-[60px] relative border-r border-border bg-background">
              <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 origin-center"
                style={{ transform: "translateX(-50%) translateY(-50%) rotate(-90deg)" }}
              >
                <span className="text-sm font-bold text-muted-foreground tracking-widest whitespace-nowrap">
                  {MONTHS[month]}
                </span>
              </div>
            </div>

            <div className="flex-1">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-cols-7 border-b border-border/50">
                  {week.map((day, dayIndex) => {
                    if (!day) {
                      return (
                        <div
                          key={`empty-${dayIndex}`}
                          className={cn("h-20 border-l border-border/30", dayIndex >= 5 && "weekend-day")}
                        />
                      )
                    }

                    const isTodayDate = isToday(day.date)
                    const isWeekend = dayIndex >= 5
                    const dayEvents = getEventsForDay(day.date)
                    const isMonthStart = day.dayOfMonth === 1
                    const dateKey = getDateKey(day.date)
                    const photo = dayPhotos.get(dateKey)
                    const isPast = isPastDay(day.date)

                    return (
                      <div
                        key={day.date.toISOString()}
                        onClick={() => onDayClick(day.date)}
                        className={cn(
                          "h-20 border-l border-border/30 px-2 py-2 cursor-pointer transition-colors hover:bg-muted/30 relative group",
                          isWeekend && "weekend-day",
                          isMonthStart && "border-l-[3px] border-l-zinc-400 dark:border-l-zinc-500",
                          isTodayDate && "today-highlight",
                          isTodayDate && pulsingToday && "animate-today-pulse",
                          isPast && !isTodayDate && "past-day-stripes",
                        )}
                        style={
                          photo
                            ? {
                                backgroundImage: `linear-gradient(rgba(255,255,255,0.7), rgba(255,255,255,0.7)), url(${photo})`,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                              }
                            : undefined
                        }
                      >
                        <div
                          className={cn(
                            "absolute flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10",
                            isMonthStart ? "bottom-1 right-1" : "top-1 left-1",
                          )}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onAddNote(day.date)
                            }}
                            className="p-1 rounded bg-background/90 hover:bg-muted text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                            title="Add note"
                          >
                            <FileText className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onAddPhoto(day.date)
                            }}
                            className="p-1 rounded bg-background/90 hover:bg-muted text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                            title="Add photo"
                          >
                            <ImageIcon className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {isMonthStart && (
                            <span className="bg-zinc-700 dark:bg-zinc-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wide">
                              {MONTHS[month]}
                            </span>
                          )}
                          <span
                            className={cn(
                              "text-sm font-semibold",
                              isTodayDate ? "text-white dark:text-zinc-900" : "text-foreground",
                            )}
                          >
                            {day.dayOfMonth}
                          </span>
                        </div>

                        {dayEvents.length > 0 && (
                          <div className="absolute bottom-1.5 left-2 right-2 flex gap-0.5 overflow-hidden">
                            {dayEvents.slice(0, 3).map((event, idx) => {
                              const colors = getEventColor(event, tags)
                              return (
                                <EventTooltip key={`${event.id}-${idx}`} event={event} tags={tags}>
                                  <div
                                    className={cn("h-1.5 flex-1 rounded-sm cursor-pointer", colors.bg, colors.darkBg)}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      onEventClick(event)
                                    }}
                                  />
                                </EventTooltip>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function YearView({
  year,
  events,
  tags,
  dayPhotos,
  onDayClick,
  onAddNote,
  onAddPhoto,
  onEventClick,
  onDeleteEvent,
  onDuplicateEvent,
  onChangeTag,
  onExtendDay,
  onShortenDay,
  onUpdateEvent,
  pulsingToday,
}: {
  year: number
  events: CalendarEvent[]
  tags: EventTag[]
  dayPhotos: Map<string, string>
  onDayClick: (date: Date) => void
  onAddNote: (date: Date) => void
  onAddPhoto: (date: Date) => void
  onEventClick: (event: CalendarEvent) => void
  onDeleteEvent: (eventId: string) => void
  onDuplicateEvent: (event: CalendarEvent) => void
  onChangeTag: (event: CalendarEvent, newTagId: string) => void
  onExtendDay: (event: CalendarEvent) => void
  onShortenDay: (event: CalendarEvent) => void
  onUpdateEvent: (event: CalendarEvent) => void
  pulsingToday?: boolean
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const COLS = 21
  const ROWS = 18

  const dragStateRef = useRef<{
    eventId: string
    type: "move" | "resize-start" | "resize-end"
    startX: number
    originalEvent: CalendarEvent
    lastDaysDelta: number
    hasDragged: boolean
  } | null>(null)
  const justFinishedDragRef = useRef(false)
  const [, forceUpdate] = useState(0)

  const gridData = useMemo(() => {
    const grid: ({ date: Date; dayOfMonth: number; month: number; dayOfWeek: number; dayIndex: number } | null)[][] = []

    const startDate = new Date(year, 0, 1)
    const endDate = new Date(year, 11, 31)
    const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1

    let dayIndex = 0
    for (let row = 0; row < ROWS; row++) {
      const rowData: ({ date: Date; dayOfMonth: number; month: number; dayOfWeek: number; dayIndex: number } | null)[] =
        []
      for (let col = 0; col < COLS; col++) {
        if (dayIndex < totalDays) {
          const date = new Date(year, 0, dayIndex + 1, 12, 0, 0, 0)
          rowData.push({
            date,
            dayOfMonth: date.getDate(),
            month: date.getMonth(),
            dayOfWeek: date.getDay(),
            dayIndex,
          })
          dayIndex++
        } else {
          rowData.push(null)
        }
      }
      grid.push(rowData)
    }
    return grid
  }, [year])

  const getCellWidth = useCallback(() => {
    if (!gridRef.current) return 50
    return gridRef.current.offsetWidth / COLS
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStateRef.current) return

      const cellWidth = getCellWidth()
      const deltaX = e.clientX - dragStateRef.current.startX
      const daysDelta = Math.round(deltaX / cellWidth)

      if (Math.abs(deltaX) > 3) {
        dragStateRef.current.hasDragged = true
      }

      if (daysDelta === dragStateRef.current.lastDaysDelta) return
      dragStateRef.current.lastDaysDelta = daysDelta

      const { originalEvent, type } = dragStateRef.current
      let newStartDate = new Date(originalEvent.startDate)
      let newEndDate = new Date(originalEvent.endDate)

      if (type === "move") {
        newStartDate = addDays(new Date(originalEvent.startDate), daysDelta)
        newEndDate = addDays(new Date(originalEvent.endDate), daysDelta)
      } else if (type === "resize-start") {
        newStartDate = addDays(new Date(originalEvent.startDate), daysDelta)
        if (newStartDate > newEndDate) newStartDate = newEndDate
      } else if (type === "resize-end") {
        newEndDate = addDays(new Date(originalEvent.endDate), daysDelta)
        if (newEndDate < newStartDate) newStartDate = newEndDate
      }

      onUpdateEvent({
        ...originalEvent,
        startDate: newStartDate,
        endDate: newEndDate,
      })
    }

    const handleMouseUp = () => {
      if (dragStateRef.current) {
        if (dragStateRef.current.hasDragged) {
          justFinishedDragRef.current = true
          setTimeout(() => {
            justFinishedDragRef.current = false
          }, 100)
        }
        dragStateRef.current = null
        forceUpdate((n) => n + 1)
      }
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [getCellWidth, onUpdateEvent])

  const handleDragStart = useCallback(
    (e: React.MouseEvent, event: CalendarEvent, type: "move" | "resize-start" | "resize-end") => {
      e.stopPropagation()
      e.preventDefault()
      dragStateRef.current = {
        eventId: event.id,
        type,
        startX: e.clientX,
        originalEvent: { ...event },
        lastDaysDelta: 0,
        hasDragged: false,
      }
      forceUpdate((n) => n + 1)
    },
    [],
  )

  const eventPositions = useMemo(() => {
    const positions: {
      event: CalendarEvent
      row: number
      startCol: number
      endCol: number
      isStart: boolean
      isEnd: boolean
      slotIndex: number
    }[] = []

    const rowSlots: Map<number, Set<number>[]> = new Map()

    events.forEach((event) => {
      const eventStart = new Date(event.startDate)
      const eventEnd = new Date(event.endDate)
      eventStart.setHours(0, 0, 0, 0)
      eventEnd.setHours(23, 59, 59, 999)

      gridData.forEach((row, rowIndex) => {
        let startCol = -1
        let endCol = -1

        row.forEach((day, colIndex) => {
          if (!day) return
          const dayDate = new Date(day.date)
          dayDate.setHours(12, 0, 0, 0)

          if (dayDate >= eventStart && dayDate <= eventEnd) {
            if (startCol === -1) startCol = colIndex
            endCol = colIndex
          }
        })

        if (startCol !== -1) {
          if (!rowSlots.has(rowIndex)) {
            rowSlots.set(rowIndex, [])
          }
          const slots = rowSlots.get(rowIndex)!

          let slotIndex = 0
          while (true) {
            if (!slots[slotIndex]) {
              slots[slotIndex] = new Set()
            }
            let conflict = false
            for (let c = startCol; c <= endCol; c++) {
              if (slots[slotIndex].has(c)) {
                conflict = true
                break
              }
            }
            if (!conflict) break
            slotIndex++
          }

          for (let c = startCol; c <= endCol; c++) {
            slots[slotIndex].add(c)
          }

          const eventStartDate = new Date(event.startDate)
          eventStartDate.setHours(0, 0, 0, 0)
          const firstDayInRow = row[startCol]?.date
          const lastDayInRow = row[endCol]?.date

          positions.push({
            event,
            row: rowIndex,
            startCol,
            endCol,
            isStart: firstDayInRow ? isSameDay(firstDayInRow, eventStartDate) : false,
            isEnd: lastDayInRow ? isSameDay(lastDayInRow, new Date(event.endDate)) : false,
            slotIndex,
          })
        }
      })
    })

    return positions
  }, [events, gridData])

  const eventsByRow = useMemo(() => {
    const byRow: Map<number, typeof eventPositions> = new Map()
    eventPositions.forEach((pos) => {
      if (!byRow.has(pos.row)) {
        byRow.set(pos.row, [])
      }
      byRow.get(pos.row)!.push(pos)
    })
    return byRow
  }, [eventPositions])

  const isDragging = dragStateRef.current !== null

  return (
    <div
      ref={scrollRef}
      className={cn("h-full overflow-auto", isDragging && "select-none")}
      style={isDragging ? { cursor: dragStateRef.current?.type === "move" ? "grabbing" : "ew-resize" } : undefined}
    >
      <div ref={gridRef} className="min-w-[1000px]">
        {gridData.map((row, rowIndex) => {
          const rowEvents = eventsByRow.get(rowIndex) || []

          return (
            <div key={rowIndex} className="relative">
              <div
                className="grid border-b border-border/30"
                style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
              >
                {row.map((day, colIndex) => {
                  if (!day) {
                    return (
                      <div
                        key={`empty-${rowIndex}-${colIndex}`}
                        className="aspect-square bg-background border-r border-border/20"
                      />
                    )
                  }

                  const isMonthStart = day.dayOfMonth === 1
                  const isTodayDate = isToday(day.date)
                  const isWeekend = day.dayOfWeek === 0 || day.dayOfWeek === 6
                  const dateKey = getDateKey(day.date)
                  const photo = dayPhotos.get(dateKey)
                  const isPast = isPastDay(day.date)

                  return (
                    <div
                      key={day.date.toISOString()}
                      onClick={() => !isDragging && onDayClick(day.date)}
                      className={cn(
                        "aspect-square bg-background border-r border-border/20 cursor-pointer transition-colors hover:bg-muted/30 relative group overflow-hidden",
                        isWeekend && "weekend-day",
                        isMonthStart && "border-l-[3px] border-l-zinc-400 dark:border-l-zinc-500",
                        isTodayDate && "today-highlight",
                        isTodayDate && pulsingToday && "animate-today-pulse",
                        isPast && !isTodayDate && "past-day-stripes",
                      )}
                      style={
                        photo
                          ? {
                              backgroundImage: `url(${photo})`,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                            }
                          : undefined
                      }
                    >
                      <div
                        className={cn(
                          "absolute flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-20",
                          isMonthStart ? "bottom-0.5 right-0.5" : "top-0.5 left-0.5",
                        )}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onAddNote(day.date)
                          }}
                          className="p-0.5 rounded bg-background/90 hover:bg-muted text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                          title="Add note"
                        >
                          <FileText className="h-2.5 w-2.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onAddPhoto(day.date)
                          }}
                          className="p-0.5 rounded bg-background/90 hover:bg-muted text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                          title="Add photo"
                        >
                          <ImageIcon className="h-2.5 w-2.5" />
                        </button>
                      </div>

                      {isMonthStart && (
                        <span className="absolute top-0.5 left-0.5 bg-zinc-700 dark:bg-zinc-600 text-white text-[7px] font-bold px-1 py-px rounded tracking-wide leading-none">
                          {MONTHS[day.month]}
                        </span>
                      )}

                      <div className="absolute top-0.5 right-0.5 flex items-center gap-0.5">
                        <span
                          className={cn(
                            "text-[7px] font-medium uppercase leading-none",
                            isTodayDate ? "text-amber-600 dark:text-amber-300" : "text-muted-foreground/60",
                          )}
                        >
                          {DAYS[day.dayOfWeek]}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] font-bold leading-none",
                            isTodayDate ? "text-amber-700 dark:text-amber-200" : "text-foreground",
                          )}
                        >
                          {day.dayOfMonth}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="absolute left-0 right-0 pointer-events-none" style={{ top: "20px" }}>
                {rowEvents.map((pos, idx) => {
                  const colors = getEventColor(pos.event, tags)
                  const leftPercent = (pos.startCol / COLS) * 100
                  const widthPercent = ((pos.endCol - pos.startCol + 1) / COLS) * 100
                  const isDraggingThis = dragStateRef.current?.eventId === pos.event.id

                  return (
                    <EventContextMenu
                      key={`${pos.event.id}-${rowIndex}-${idx}`}
                      event={pos.event}
                      onEdit={onEventClick}
                      onDelete={onDeleteEvent}
                      onDuplicate={onDuplicateEvent}
                      onChangeTag={onChangeTag}
                      onExtendDay={onExtendDay}
                      onShortenDay={onShortenDay}
                    >
                      <EventTooltip event={pos.event} tags={tags}>
                        <div
                          className={cn(
                            "absolute h-[16px] flex items-center text-[9px] font-medium truncate pointer-events-auto hover:brightness-110 transition-all group/event",
                            colors.bg,
                            colors.darkBg,
                            colors.text,
                            pos.isStart ? "rounded-l pl-1" : "pl-0.5",
                            pos.isEnd ? "rounded-r pr-0.5" : "",
                            isDraggingThis && "opacity-70 cursor-grabbing ring-2 ring-white/50",
                          )}
                          style={{
                            left: `calc(${leftPercent}% + 1px)`,
                            width: `calc(${widthPercent}% - 2px)`,
                            top: `${pos.slotIndex * 18}px`,
                          }}
                          onMouseDown={(e) => handleDragStart(e, pos.event, "move")}
                          onClick={(e) => {
                            e.stopPropagation()
                            if (!isDragging && !justFinishedDragRef.current) {
                              onEventClick(pos.event)
                            }
                          }}
                        >
                          {pos.isStart && (
                            <div
                              className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover/event:opacity-100 hover:bg-black/20 rounded-l"
                              onMouseDown={(e) => {
                                e.stopPropagation()
                                handleDragStart(e, pos.event, "resize-start")
                              }}
                            />
                          )}
                          {pos.isStart && pos.event.title}
                          {pos.isEnd && (
                            <div
                              className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover/event:opacity-100 hover:bg-black/20 rounded-r"
                              onMouseDown={(e) => {
                                e.stopPropagation()
                                handleDragStart(e, pos.event, "resize-end")
                              }}
                            />
                          )}
                        </div>
                      </EventTooltip>
                    </EventContextMenu>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
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
  const [isDevMode, setIsDevMode] = useState(false)
  const [pulsingToday, setPulsingToday] = useState(false)

  const { events, tags, isLoading, createEvent, updateEvent, deleteEvent } = useSanityCalendar()

  const [localEvents, setLocalEvents] = useState<CalendarEvent[]>([])

  // Sync Sanity events to local state
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
      // Fallback to local-only if API fails
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
      // Continue with local delete even if API fails
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
    } catch (error) {
      // Continue with local update
    }
    setLocalEvents((prev) => prev.map((e) => (e.id === event.id ? updatedEvent : e)))
  }

  const handleExtendDay = async (event: CalendarEvent) => {
    const newEndDate = new Date(event.endDate)
    newEndDate.setDate(newEndDate.getDate() + 1)
    const updatedEvent = { ...event, endDate: newEndDate }
    try {
      await updateEvent(updatedEvent)
    } catch (error) {
      // Continue with local update
    }
    setLocalEvents((prev) => prev.map((e) => (e.id === event.id ? updatedEvent : e)))
  }

  const handleShortenDay = async (event: CalendarEvent) => {
    const newEndDate = new Date(event.endDate)
    newEndDate.setDate(newEndDate.getDate() - 1)
    if (newEndDate >= event.startDate) {
      const updatedEvent = { ...event, endDate: newEndDate }
      try {
        await updateEvent(updatedEvent)
      } catch (error) {
        // Continue with local update
      }
      setLocalEvents((prev) => prev.map((e) => (e.id === event.id ? updatedEvent : e)))
    }
  }

  const handleUpdateEvent = async (event: CalendarEvent) => {
    try {
      await updateEvent(event)
    } catch (error) {
      // Continue with local update
    }
    setLocalEvents((prev) => prev.map((e) => (e.id === event.id ? event : e)))
  }

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

  const justFinishedDragRef = useRef(false)

  return (
    <TooltipProvider delayDuration={1200}>
      <div className="h-screen flex flex-col bg-background relative">
        {/* Header */}
        <header className="flex-shrink-0 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between px-4 h-12">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setYear(year - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-lg font-semibold min-w-[60px] text-center">{year}</span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setYear(year + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <TagFilter tags={tags} selectedTags={selectedTags} onTagsChange={setSelectedTags} />

              <Button
                variant={isDevMode ? "default" : "outline"}
                size="sm"
                className="h-8 gap-1.5"
                onClick={() => setIsDevMode(!isDevMode)}
              >
                <Code className="h-3.5 w-3.5" />
                Dev
              </Button>

              <ThemeToggle />

              <Button size="sm" className="h-8 gap-1.5" onClick={() => handleDayClick(new Date())}>
                <Plus className="h-3.5 w-3.5" />
                Event
              </Button>
            </div>
          </div>
        </header>

        <div className="flex-1 min-h-0 relative">
          {isLoading ? (
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
              onUpdateEvent={handleUpdateEvent}
              pulsingToday={pulsingToday}
            />
          )}

          {isDevMode && <DevModeOverlay onClose={() => setIsDevMode(false)} />}
        </div>

        <AIDock tags={tags} onAddEvents={handleAddEventsFromAI} />

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
