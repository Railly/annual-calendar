"use client"

import type React from "react"
import { useState, useRef, useMemo, useCallback, useEffect } from "react"
import { FileText, ImageIcon } from "lucide-react"
import type { CalendarEvent, EventTag } from "@/lib/calendar-data"
import { EventTooltip } from "@/components/event-tooltip"
import { EventContextMenu } from "@/components/event-context-menu"
import { cn } from "@/lib/utils"

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]
const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]

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

interface YearViewProps {
  year: number
  events: CalendarEvent[]
  tags: EventTag[]
  dayPhotos: Map<string, string>
  dayNotes?: Map<string, string>
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
  onCommitUpdate: () => void
  pulsingToday?: boolean
  onCreateEventFromDrag?: (startDate: Date, endDate: Date) => void
  clearDragSelectionRef?: React.MutableRefObject<(() => void) | null>
}

export function YearView({
  year,
  events,
  tags,
  dayPhotos,
  dayNotes,
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
  onCommitUpdate,
  pulsingToday,
  onCreateEventFromDrag,
  clearDragSelectionRef,
}: YearViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const COLS = 21
  const ROWS = 18

  const dragStateRef = useRef<{
    eventId: string
    type: "move" | "resize-start" | "resize-end"
    startX: number
    startY: number
    originalEvent: CalendarEvent
    lastDaysDelta: number
    hasDragged: boolean
  } | null>(null)

  const justFinishedDragRef = useRef(false)

  const [dragGhost, setDragGhost] = useState<{
    event: CalendarEvent
    x: number
    y: number
    width: number
  } | null>(null)

  const [, forceUpdate] = useState(0)

  const [dragSelection, setDragSelection] = useState<{
    startDate: Date
    endDate: Date
    isActive: boolean
    isPending: boolean
  } | null>(null)

  const dragSelectionRef = useRef<{
    startDate: Date
    startCellIndex: number
    isActive: boolean
  } | null>(null)

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

  const getCellDimensions = useCallback(() => {
    if (!gridRef.current) return { width: 50, height: 50 }
    const firstCell = gridRef.current.querySelector("[data-cell]")
    if (firstCell) {
      const rect = firstCell.getBoundingClientRect()
      return { width: rect.width, height: rect.height }
    }
    return { width: gridRef.current.offsetWidth / COLS, height: 50 }
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStateRef.current) return

      const { width: cellWidth, height: cellHeight } = getCellDimensions()
      const deltaX = e.clientX - dragStateRef.current.startX
      const deltaY = e.clientY - dragStateRef.current.startY

      if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
        dragStateRef.current.hasDragged = true
      }

      if (dragStateRef.current.type === "move" && dragStateRef.current.hasDragged) {
        const eventDuration =
          Math.ceil(
            (dragStateRef.current.originalEvent.endDate.getTime() -
              dragStateRef.current.originalEvent.startDate.getTime()) /
              (1000 * 60 * 60 * 24),
          ) + 1

        setDragGhost({
          event: dragStateRef.current.originalEvent,
          x: e.clientX - cellWidth / 2,
          y: e.clientY - 8,
          width: Math.min(eventDuration, 5) * cellWidth,
        })
      }

      const daysDelta = Math.round(deltaX / cellWidth)
      const rowsDelta = Math.round(deltaY / cellHeight)
      const totalDaysDelta = daysDelta + rowsDelta * COLS

      if (totalDaysDelta === dragStateRef.current.lastDaysDelta) return
      dragStateRef.current.lastDaysDelta = totalDaysDelta

      const { originalEvent, type } = dragStateRef.current
      let newStartDate = new Date(originalEvent.startDate)
      let newEndDate = new Date(originalEvent.endDate)

      if (type === "move") {
        newStartDate = addDays(new Date(originalEvent.startDate), totalDaysDelta)
        newEndDate = addDays(new Date(originalEvent.endDate), totalDaysDelta)
      } else if (type === "resize-start") {
        newStartDate = addDays(new Date(originalEvent.startDate), daysDelta)
        if (newStartDate > newEndDate) newStartDate = newEndDate
      } else if (type === "resize-end") {
        newEndDate = addDays(new Date(originalEvent.endDate), daysDelta)
        if (newEndDate < newStartDate) newEndDate = newStartDate
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
          onCommitUpdate()
          setTimeout(() => {
            justFinishedDragRef.current = false
          }, 100)
        }
        dragStateRef.current = null
        setDragGhost(null)
        forceUpdate((n) => n + 1)
      }

      if (dragSelectionRef.current?.isActive && dragSelection) {
        dragSelectionRef.current = null

        if (dragSelection.startDate.getTime() !== dragSelection.endDate.getTime() || true) {
          if (onCreateEventFromDrag) {
            onCreateEventFromDrag(dragSelection.startDate, dragSelection.endDate)
          }
        }

        setDragSelection((prev) => (prev ? { ...prev, isActive: false, isPending: true } : null))
      }
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [getCellDimensions, onUpdateEvent, onCommitUpdate, dragSelection, onCreateEventFromDrag])

  useEffect(() => {
    if (clearDragSelectionRef) {
      clearDragSelectionRef.current = () => {
        setDragSelection(null)
      }
    }
    return () => {
      if (clearDragSelectionRef) {
        clearDragSelectionRef.current = null
      }
    }
  }, [clearDragSelectionRef])

  const handleDragStart = useCallback(
    (e: React.MouseEvent, event: CalendarEvent, type: "move" | "resize-start" | "resize-end") => {
      e.stopPropagation()
      e.preventDefault()
      dragStateRef.current = {
        eventId: event.id,
        type,
        startX: e.clientX,
        startY: e.clientY,
        originalEvent: { ...event },
        lastDaysDelta: 0,
        hasDragged: false,
      }
      forceUpdate((n) => n + 1)
    },
    [],
  )

  const getDateFromCellIndex = useCallback(
    (row: number, col: number): Date | null => {
      const cellData = gridData[row]?.[col]
      return cellData?.date || null
    },
    [gridData],
  )

  const handleCellMouseDown = useCallback((e: React.MouseEvent, date: Date, row: number, col: number) => {
    if (e.button !== 0) return
    if ((e.target as HTMLElement).closest("[data-event-bar]")) return

    e.preventDefault()
    dragSelectionRef.current = {
      startDate: date,
      startCellIndex: row * COLS + col,
      isActive: true,
    }
    setDragSelection({
      startDate: date,
      endDate: date,
      isActive: true,
      isPending: false,
    })
  }, [])

  const handleCellMouseMove = useCallback((e: React.MouseEvent, date: Date) => {
    if (!dragSelectionRef.current?.isActive) return

    const startDate = dragSelectionRef.current.startDate
    let newStart = startDate
    let newEnd = date

    if (date < startDate) {
      newStart = date
      newEnd = startDate
    }

    setDragSelection({
      startDate: newStart,
      endDate: newEnd,
      isActive: true,
      isPending: false,
    })
  }, [])

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

  const isDateInSelection = useCallback(
    (date: Date): boolean => {
      if (!dragSelection?.isActive && !dragSelection?.isPending) return false
      const checkDate = new Date(date)
      checkDate.setHours(0, 0, 0, 0)
      const start = new Date(dragSelection.startDate)
      start.setHours(0, 0, 0, 0)
      const end = new Date(dragSelection.endDate)
      end.setHours(23, 59, 59, 999)
      return checkDate >= start && checkDate <= end
    },
    [dragSelection],
  )

  const isDragging = dragStateRef.current !== null
  const isDragSelecting = dragSelectionRef.current?.isActive || false

  return (
    <div
      ref={scrollRef}
      className={cn("h-full overflow-auto", (isDragging || isDragSelecting) && "select-none")}
      style={
        isDragging || isDragSelecting
          ? {
              cursor:
                isDragging && dragStateRef.current?.type === "move"
                  ? "grabbing"
                  : isDragSelecting
                    ? "crosshair"
                    : "ew-resize",
            }
          : undefined
      }
    >
      <div ref={gridRef} className="min-w-[1000px]">
        {gridData.map((row, rowIndex) => {
          const rowEvents = eventsByRow.get(rowIndex) || []

          return (
            <div key={rowIndex} className="relative" data-row={rowIndex}>
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
                        data-cell
                      />
                    )
                  }

                  const isMonthStart = day.dayOfMonth === 1
                  const isTodayDate = isToday(day.date)
                  const isWeekend = day.dayOfWeek === 0 || day.dayOfWeek === 6
                  const dateKey = getDateKey(day.date)
                  const photo = dayPhotos.get(dateKey)
                  const isPast = isPastDay(day.date)
                  const isInSelection = isDateInSelection(day.date)

                  return (
                    <div
                      key={day.date.toISOString()}
                      data-cell
                      data-cell-date={dateKey}
                      onMouseDown={(e) => handleCellMouseDown(e, day.date, rowIndex, colIndex)}
                      onMouseMove={(e) => handleCellMouseMove(e, day.date)}
                      onClick={() => !isDragging && !isDragSelecting && onDayClick(day.date)}
                      className={cn(
                        "aspect-square bg-background border-r border-border/20 cursor-pointer transition-colors hover:bg-muted/30 relative group",
                        isWeekend && "weekend-day",
                        isMonthStart && "month-start-line",
                        isTodayDate && "today-highlight",
                        isTodayDate && pulsingToday && "animate-today-pulse",
                        isPast && !isTodayDate && "past-day-stripes",
                        isInSelection && "drag-selection-cell",
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
                        <span className="absolute top-0 left-0 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[7px] font-bold px-1 py-px tracking-wide leading-none">
                          {MONTHS[day.month]}
                        </span>
                      )}

                      <div className="absolute top-0.5 right-0.5 flex items-center gap-0.5">
                        <span
                          className={cn(
                            "text-[7px] font-medium uppercase leading-none",
                            isTodayDate ? "today-text-light-muted" : "text-muted-foreground/60",
                          )}
                        >
                          {DAYS[day.dayOfWeek]}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] font-bold leading-none",
                            isTodayDate ? "today-text-light" : "text-foreground",
                          )}
                        >
                          {day.dayOfMonth}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {(dragSelection?.isActive || dragSelection?.isPending) &&
                (() => {
                  const rowStartDate = row[0]?.date
                  const rowEndDate = row[COLS - 1]?.date || row.filter(Boolean).pop()?.date

                  if (!rowStartDate || !rowEndDate) return null

                  const selStart = new Date(dragSelection.startDate)
                  selStart.setHours(0, 0, 0, 0)
                  const selEnd = new Date(dragSelection.endDate)
                  selEnd.setHours(23, 59, 59, 999)

                  const rowS = new Date(rowStartDate)
                  rowS.setHours(0, 0, 0, 0)
                  const rowE = new Date(rowEndDate)
                  rowE.setHours(23, 59, 59, 999)

                  if (selEnd < rowS || selStart > rowE) return null

                  let startCol = 0
                  let endCol = COLS - 1

                  for (let c = 0; c < COLS; c++) {
                    const cellDate = row[c]?.date
                    if (cellDate) {
                      const cd = new Date(cellDate)
                      cd.setHours(0, 0, 0, 0)
                      if (cd >= selStart && startCol === 0) {
                        startCol = c
                      }
                      if (cd <= selEnd) {
                        endCol = c
                      }
                    }
                  }

                  const leftPercent = (startCol / COLS) * 100
                  const widthPercent = ((endCol - startCol + 1) / COLS) * 100

                  return (
                    <div
                      className="absolute h-[16px] flex items-center text-[9px] font-medium truncate pointer-events-none preview-swimlane rounded"
                      style={{
                        left: `calc(${leftPercent}% + 1px)`,
                        width: `calc(${widthPercent}% - 2px)`,
                        top: "20px",
                      }}
                    >
                      <span className="pl-1 text-teal-700 dark:text-teal-200">New Event</span>
                    </div>
                  )
                })()}

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
                      tags={tags}
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
                            "absolute h-[16px] flex items-center text-[9px] font-medium truncate pointer-events-auto cursor-pointer hover:brightness-110 transition-all group/event",
                            colors.bg,
                            colors.darkBg,
                            colors.text,
                            pos.isStart ? "rounded-l pl-1" : "pl-0.5",
                            pos.isEnd ? "rounded-r pr-0.5" : "",
                            isDraggingThis && "opacity-50 cursor-grabbing ring-2 ring-white/50",
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

      {dragGhost && (
        <div
          className="fixed pointer-events-none z-50"
          style={{
            left: dragGhost.x,
            top: dragGhost.y,
            width: dragGhost.width,
          }}
        >
          <div
            className={cn(
              "h-[16px] flex items-center text-[9px] font-medium truncate rounded px-1 shadow-lg ring-2 ring-white/30",
              getEventColor(dragGhost.event, tags).bg,
              getEventColor(dragGhost.event, tags).text,
            )}
          >
            {dragGhost.event.title}
          </div>
        </div>
      )}
    </div>
  )
}
