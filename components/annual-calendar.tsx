"use client"

import { useState, useRef, useMemo } from "react"
import { ChevronLeft, ChevronRight, FileText, ImageIcon, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { type CalendarEvent, sampleEvents } from "@/lib/calendar-data"
import { EventModal } from "@/components/event-modal"
import { NoteModal } from "@/components/note-modal"
import { PhotoModal } from "@/components/photo-modal"
import { EventTooltip } from "@/components/event-tooltip"
import { EventContextMenu } from "@/components/event-context-menu"
import { cn } from "@/lib/utils"

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]
const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]
const WEEK_DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]

const EVENT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  orange: { bg: "bg-orange-500", text: "text-white", border: "border-orange-500" },
  teal: { bg: "bg-teal-500", text: "text-white", border: "border-teal-500" },
  purple: { bg: "bg-purple-500", text: "text-white", border: "border-purple-500" },
  green: { bg: "bg-emerald-500", text: "text-white", border: "border-emerald-500" },
  pink: { bg: "bg-pink-500", text: "text-white", border: "border-pink-500" },
  blue: { bg: "bg-blue-500", text: "text-white", border: "border-blue-500" },
  yellow: { bg: "bg-amber-400", text: "text-amber-900", border: "border-amber-400" },
  red: { bg: "bg-red-500", text: "text-white", border: "border-red-500" },
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
  return date.toISOString().split("T")[0]
}

function DayView({
  year,
  month,
  day,
  events,
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
              const colors = EVENT_COLORS[event.color] || EVENT_COLORS.blue
              return (
                <EventContextMenu key={event.id} event={event} onEdit={onEventClick} onDelete={onDeleteEvent}>
                  <div
                    className={cn(
                      "px-4 py-3 rounded-lg text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity",
                      colors.bg,
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
                  i >= 5 ? "bg-muted/50 text-muted-foreground" : "text-muted-foreground",
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
                          className={cn("h-20 border-l border-border/30", dayIndex >= 5 && "bg-muted/40")}
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
                          isWeekend && "bg-muted/40",
                          isMonthStart && "border-l-[3px] border-l-zinc-400",
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
                            <span className="bg-zinc-700 text-white text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wide">
                              {MONTHS[month]}
                            </span>
                          )}
                          <span
                            className={cn(
                              "text-sm font-semibold",
                              isTodayDate
                                ? "bg-teal-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs"
                                : "text-foreground",
                            )}
                          >
                            {day.dayOfMonth}
                          </span>
                        </div>

                        {dayEvents.length > 0 && (
                          <div className="absolute bottom-1.5 left-2 right-2 flex gap-0.5 overflow-hidden">
                            {dayEvents.slice(0, 3).map((event, idx) => {
                              const colors = EVENT_COLORS[event.color] || EVENT_COLORS.blue
                              return (
                                <EventTooltip key={`${event.id}-${idx}`} event={event}>
                                  <div
                                    className={cn("h-1.5 flex-1 rounded-sm cursor-pointer", colors.bg)}
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
  dayPhotos: Map<string, string>
  onDayClick: (date: Date) => void
  onAddNote: (date: Date) => void
  onAddPhoto: (date: Date) => void
  onEventClick: (event: CalendarEvent) => void
  onDeleteEvent: (eventId: string) => void
  pulsingToday?: boolean
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const COLS = 21
  const ROWS = 18

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
          const date = new Date(year, 0, dayIndex + 1)
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

  return (
    <div ref={scrollRef} className="flex-1 overflow-auto">
      <div className="min-w-[1000px]">
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
                      onClick={() => onDayClick(day.date)}
                      className={cn(
                        "aspect-square bg-background border-r border-border/20 cursor-pointer transition-colors hover:bg-muted/30 relative group overflow-hidden",
                        isWeekend && "bg-muted/40",
                        isMonthStart && "border-l-[3px] border-l-zinc-400",
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
                        <span className="absolute top-0.5 left-0.5 bg-zinc-700 text-white text-[7px] font-bold px-1 py-px rounded tracking-wide leading-none">
                          {MONTHS[day.month]}
                        </span>
                      )}

                      <div className="absolute top-0.5 right-0.5 flex items-center gap-0.5">
                        <span
                          className={cn("text-[7px] font-medium uppercase leading-none", "text-muted-foreground/60")}
                        >
                          {DAYS[day.dayOfWeek]}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] font-bold leading-none",
                            isTodayDate
                              ? "bg-teal-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px]"
                              : "text-foreground",
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
                  const colors = EVENT_COLORS[pos.event.color] || EVENT_COLORS.blue
                  const leftPercent = (pos.startCol / COLS) * 100
                  const widthPercent = ((pos.endCol - pos.startCol + 1) / COLS) * 100

                  return (
                    <EventContextMenu
                      key={`${pos.event.id}-${rowIndex}-${idx}`}
                      event={pos.event}
                      onEdit={onEventClick}
                      onDelete={onDeleteEvent}
                    >
                      <EventTooltip event={pos.event}>
                        <div
                          className={cn(
                            "absolute h-[16px] flex items-center text-[9px] font-medium truncate pointer-events-auto cursor-pointer hover:brightness-110 transition-all",
                            colors.bg,
                            colors.text,
                            pos.isStart ? "rounded-l pl-1" : "pl-0.5",
                            pos.isEnd ? "rounded-r pr-0.5" : "",
                          )}
                          style={{
                            left: `calc(${leftPercent}% + 1px)`,
                            width: `calc(${widthPercent}% - 2px)`,
                            top: `${pos.slotIndex * 18}px`,
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            onEventClick(pos.event)
                          }}
                        >
                          {pos.isStart && pos.event.title}
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
  const [events, setEvents] = useState<CalendarEvent[]>(sampleEvents)
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false)
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null)
  const [view, setView] = useState<"Day" | "Week" | "Year">("Year")
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentDay, setCurrentDay] = useState(new Date().getDate())
  const [dayNotes, setDayNotes] = useState<Map<string, string>>(new Map())
  const [dayPhotos, setDayPhotos] = useState<Map<string, string>>(new Map())
  const [pulsingToday, setPulsingToday] = useState(false)

  const handlePrevYear = () => setYear((y) => y - 1)
  const handleNextYear = () => setYear((y) => y + 1)

  const handlePrevDay = () => {
    const currentDate = new Date(year, currentMonth, currentDay)
    currentDate.setDate(currentDate.getDate() - 1)
    setCurrentDay(currentDate.getDate())
    setCurrentMonth(currentDate.getMonth())
    setYear(currentDate.getFullYear())
  }

  const handleNextDay = () => {
    const currentDate = new Date(year, currentMonth, currentDay)
    currentDate.setDate(currentDate.getDate() + 1)
    setCurrentDay(currentDate.getDate())
    setCurrentMonth(currentDate.getMonth())
    setYear(currentDate.getFullYear())
  }

  const handleDayClick = (date: Date) => {
    setSelectedDate(date)
    setEditEvent(null)
    setIsEventModalOpen(true)
  }

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedDate(new Date(event.startDate))
    setEditEvent(event)
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

  const handleSaveNote = (date: Date, note: string) => {
    const key = getDateKey(date)
    setDayNotes((prev) => {
      const newMap = new Map(prev)
      newMap.set(key, note)
      return newMap
    })
  }

  const handleSavePhoto = (date: Date, photoUrl: string) => {
    const key = getDateKey(date)
    setDayPhotos((prev) => {
      const newMap = new Map(prev)
      newMap.set(key, photoUrl)
      return newMap
    })
  }

  const handleRemovePhoto = (date: Date) => {
    const key = getDateKey(date)
    setDayPhotos((prev) => {
      const newMap = new Map(prev)
      newMap.delete(key)
      return newMap
    })
  }

  const handleAddEvent = (event: CalendarEvent) => {
    setEvents((prev) => [...prev, event])
  }

  const handleUpdateEvent = (event: CalendarEvent) => {
    setEvents((prev) => prev.map((e) => (e.id === event.id ? event : e)))
  }

  const handleDeleteEvent = (eventId: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== eventId))
  }

  const handleGoToToday = () => {
    const today = new Date()
    setYear(today.getFullYear())
    setCurrentMonth(today.getMonth())
    setCurrentDay(today.getDate())
    setPulsingToday(true)
    setTimeout(() => setPulsingToday(false), 1600) // 2 pulses at 0.8s each
  }

  const getHeaderTitle = () => {
    if (view === "Day") {
      const date = new Date(year, currentMonth, currentDay)
      return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
    }
    return year.toString()
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="border-b border-border px-3 py-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
          {(["Day", "Week", "Year"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                "px-3 py-1 text-sm font-medium rounded-md transition-colors",
                view === v ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {v}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {view === "Day" && (
            <>
              <Button size="icon" variant="ghost" onClick={handlePrevDay} className="h-7 w-7">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-semibold min-w-[180px] text-center">{getHeaderTitle()}</span>
              <Button size="icon" variant="ghost" onClick={handleNextDay} className="h-7 w-7">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
          {(view === "Week" || view === "Year") && (
            <>
              <Button size="icon" variant="ghost" onClick={handlePrevYear} className="h-7 w-7">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-lg font-bold min-w-[60px] text-center">{year}</span>
              <Button size="icon" variant="ghost" onClick={handleNextYear} className="h-7 w-7">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleGoToToday} className="text-xs h-7">
            Today
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setSelectedDate(new Date())
              setEditEvent(null)
              setIsEventModalOpen(true)
            }}
            className="h-7 gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Event</span>
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {view === "Day" && (
          <DayView
            year={year}
            month={currentMonth}
            day={currentDay}
            events={events}
            dayPhotos={dayPhotos}
            dayNotes={dayNotes}
            onDayClick={handleDayClick}
            onEventClick={handleEventClick}
            onDeleteEvent={handleDeleteEvent}
          />
        )}
        {view === "Week" && (
          <WeekView
            year={year}
            events={events}
            dayPhotos={dayPhotos}
            onDayClick={handleDayClick}
            onAddNote={handleAddNote}
            onAddPhoto={handleAddPhoto}
            onEventClick={handleEventClick}
            onDeleteEvent={handleDeleteEvent}
            pulsingToday={pulsingToday}
          />
        )}
        {view === "Year" && (
          <YearView
            year={year}
            events={events}
            dayPhotos={dayPhotos}
            onDayClick={handleDayClick}
            onAddNote={handleAddNote}
            onAddPhoto={handleAddPhoto}
            onEventClick={handleEventClick}
            onDeleteEvent={handleDeleteEvent}
            pulsingToday={pulsingToday}
          />
        )}
      </div>

      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => {
          setIsEventModalOpen(false)
          setEditEvent(null)
        }}
        date={selectedDate}
        events={events}
        onAddEvent={handleAddEvent}
        onUpdateEvent={handleUpdateEvent}
        onDeleteEvent={handleDeleteEvent}
        editEvent={editEvent}
      />

      <NoteModal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        date={selectedDate}
        existingNote={selectedDate ? dayNotes.get(getDateKey(selectedDate)) : undefined}
        onSave={handleSaveNote}
      />

      <PhotoModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        date={selectedDate}
        existingPhoto={selectedDate ? dayPhotos.get(getDateKey(selectedDate)) : undefined}
        onSave={handleSavePhoto}
        onRemove={handleRemovePhoto}
      />
    </div>
  )
}
