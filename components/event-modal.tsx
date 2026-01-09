"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { X, Trash2, Calendar, Tag, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import type { CalendarEvent, EventTag } from "@/lib/calendar-data"
import { parseDateString } from "@/lib/calendar-data"
import { cn } from "@/lib/utils"

interface EventModalProps {
  isOpen: boolean
  onClose: () => void
  date: Date | null
  events: CalendarEvent[]
  tags: EventTag[]
  onAddEvent: (event: CalendarEvent) => void
  onUpdateEvent?: (event: CalendarEvent) => void
  onDeleteEvent?: (eventId: string) => void
  editEvent?: CalendarEvent | null
}

const TAG_COLORS: Record<string, { bg: string; ring: string; light: string }> = {
  orange: { bg: "bg-orange-500", ring: "ring-orange-500", light: "bg-orange-50 text-orange-700 border-orange-200" },
  teal: { bg: "bg-teal-500", ring: "ring-teal-500", light: "bg-teal-50 text-teal-700 border-teal-200" },
  purple: { bg: "bg-purple-500", ring: "ring-purple-500", light: "bg-purple-50 text-purple-700 border-purple-200" },
  green: { bg: "bg-emerald-500", ring: "ring-emerald-500", light: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  pink: { bg: "bg-pink-500", ring: "ring-pink-500", light: "bg-pink-50 text-pink-700 border-pink-200" },
  blue: { bg: "bg-blue-500", ring: "ring-blue-500", light: "bg-blue-50 text-blue-700 border-blue-200" },
  yellow: { bg: "bg-amber-400", ring: "ring-amber-400", light: "bg-amber-50 text-amber-700 border-amber-200" },
  red: { bg: "bg-red-500", ring: "ring-red-500", light: "bg-red-50 text-red-700 border-red-200" },
}

function formatDateToInput(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return ""
  const date = parseDateString(dateStr)
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
}

export function EventModal({
  isOpen,
  onClose,
  date,
  events,
  tags,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  editEvent,
}: EventModalProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [selectedTag, setSelectedTag] = useState(tags[0]?.id || "travel")
  const titleInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      if (editEvent) {
        setTitle(editEvent.title)
        setDescription(editEvent.description || "")
        setStartDate(formatDateToInput(new Date(editEvent.startDate)))
        setEndDate(formatDateToInput(new Date(editEvent.endDate)))
        setSelectedTag(editEvent.tag)
      } else {
        setTitle("")
        setDescription("")
        setSelectedTag(tags[0]?.id || "travel")
        if (date) {
          const dateStr = formatDateToInput(date)
          setStartDate(dateStr)
          setEndDate(dateStr)
        }
      }
      setTimeout(() => titleInputRef.current?.focus(), 300)
    }
  }, [isOpen, date, editEvent, tags])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !startDate || !endDate) return

    const eventData = {
      id: editEvent?.id || crypto.randomUUID(),
      title,
      description,
      startDate: parseDateString(startDate),
      endDate: parseDateString(endDate),
      tag: selectedTag,
    }

    if (editEvent && onUpdateEvent) {
      onUpdateEvent(eventData)
    } else {
      onAddEvent(eventData)
    }
    onClose()
  }

  const handleDelete = () => {
    if (editEvent && onDeleteEvent) {
      onDeleteEvent(editEvent.id)
      onClose()
    }
  }

  const selectedTagData = tags.find((t) => t.id === selectedTag)
  const selectedTagColors = TAG_COLORS[selectedTagData?.color || "blue"]

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="left" className="w-full sm:max-w-[440px] p-0 flex flex-col gap-0">
        {/* Header with colored accent */}
        <div className={cn("px-6 pt-6 pb-5 border-b", selectedTagColors?.light || "bg-muted")}>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider opacity-60">
                {editEvent ? "Edit Event" : "New Event"}
              </p>
              <h2 className="text-xl font-semibold">{title || (editEvent ? "Untitled Event" : "Create an event")}</h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-full -mr-2 -mt-2 opacity-60 hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {(startDate || endDate) && (
            <p className="text-sm mt-2 opacity-70">
              {formatDateDisplay(startDate)}
              {startDate !== endDate && ` → ${formatDateDisplay(endDate)}`}
            </p>
          )}
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileText className="h-3.5 w-3.5" />
                Title
              </label>
              <Input
                ref={titleInputRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What's happening?"
                className="h-11 text-base border-0 bg-muted/50 focus-visible:bg-muted focus-visible:ring-1"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add details, notes, or links..."
                className="min-h-[100px] resize-none border-0 bg-muted/50 focus-visible:bg-muted focus-visible:ring-1"
              />
            </div>

            {/* Dates */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                When
              </label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-11 border-0 bg-muted/50 focus-visible:bg-muted focus-visible:ring-1"
                  />
                </div>
                <span className="flex items-center text-muted-foreground text-sm">to</span>
                <div className="flex-1">
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-11 border-0 bg-muted/50 focus-visible:bg-muted focus-visible:ring-1"
                  />
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Tag className="h-3.5 w-3.5" />
                Category
              </label>
              <div className="flex gap-2 flex-wrap">
                {tags.map((tag) => {
                  const colors = TAG_COLORS[tag.color] || TAG_COLORS.blue
                  const isSelected = selectedTag === tag.id
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => setSelectedTag(tag.id)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border",
                        isSelected
                          ? cn(colors.light, "border-current")
                          : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted/50",
                      )}
                    >
                      <div className={cn("w-2.5 h-2.5 rounded-full", colors.bg)} />
                      {tag.name}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="border-t p-4 bg-muted/30">
          <div className="flex items-center gap-3">
            {editEvent && onDeleteEvent && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            )}
            <div className="flex-1" />
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              onClick={handleSubmit}
              disabled={!title || !startDate || !endDate}
              className={cn("gap-2", selectedTagColors?.bg, "hover:opacity-90 text-white")}
            >
              {editEvent ? "Save Changes" : "Create Event"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
