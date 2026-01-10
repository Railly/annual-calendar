"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { X, Trash2, Calendar, Tag, FileText, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Sheet, SheetContent, SheetDescription } from "@/components/ui/sheet"
import type { CalendarEvent, EventTag } from "@/lib/calendar-data"
import { parseDateString } from "@/lib/calendar-data"
import { cn } from "@/lib/utils"

interface EventModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (eventData: Omit<CalendarEvent, "id"> & { id?: string }) => void
  onDelete?: () => void
  event: CalendarEvent | null
  defaultDate: Date
  tags: EventTag[]
}

const TAG_COLORS: Record<string, { bg: string; ring: string; light: string }> = {
  orange: {
    bg: "bg-orange-500",
    ring: "ring-orange-500",
    light:
      "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800",
  },
  teal: {
    bg: "bg-teal-500",
    ring: "ring-teal-500",
    light: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800",
  },
  purple: {
    bg: "bg-purple-500",
    ring: "ring-purple-500",
    light:
      "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800",
  },
  green: {
    bg: "bg-emerald-500",
    ring: "ring-emerald-500",
    light:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
  },
  pink: {
    bg: "bg-pink-500",
    ring: "ring-pink-500",
    light: "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950 dark:text-pink-300 dark:border-pink-800",
  },
  blue: {
    bg: "bg-blue-500",
    ring: "ring-blue-500",
    light: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  },
  yellow: {
    bg: "bg-amber-400",
    ring: "ring-amber-400",
    light: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  },
  red: {
    bg: "bg-red-500",
    ring: "ring-red-500",
    light: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
  },
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

export function EventModal({ isOpen, onClose, onSave, onDelete, event, defaultDate, tags }: EventModalProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [selectedTag, setSelectedTag] = useState(tags[0]?.id || "travel")
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const titleInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      if (event) {
        // Editing existing event
        setTitle(event.title)
        setDescription(event.description || "")
        setStartDate(formatDateToInput(new Date(event.startDate)))
        setEndDate(formatDateToInput(new Date(event.endDate)))
        setSelectedTag(event.tag)
      } else {
        // Creating new event
        setTitle("")
        setDescription("")
        setSelectedTag(tags[0]?.id || "travel")
        const dateStr = formatDateToInput(defaultDate)
        setStartDate(dateStr)
        setEndDate(dateStr)
      }
      setTimeout(() => titleInputRef.current?.focus(), 300)
    }
  }, [isOpen, defaultDate, event, tags])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !startDate || !endDate || isSaving) return

    setIsSaving(true)
    try {
      await onSave({
        id: event?.id,
        title,
        description,
        startDate: parseDateString(startDate),
        endDate: parseDateString(endDate),
        tag: selectedTag,
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (onDelete && !isDeleting) {
      setIsDeleting(true)
      try {
        await onDelete()
      } finally {
        setIsDeleting(false)
      }
    }
  }

  const selectedTagData = tags.find((t) => t.id === selectedTag)
  const selectedTagColors = TAG_COLORS[selectedTagData?.color || "blue"]
  const isEditing = !!event

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-[400px] p-0 flex flex-col gap-0">
        <SheetDescription className="sr-only">
          {isEditing ? "Edit event details" : "Create a new event"}
        </SheetDescription>
        {/* Header with colored accent */}
        <div className={cn("px-4 pt-4 pb-3 border-b", selectedTagColors?.light || "bg-muted")}>
          <div className="flex items-start justify-between">
            <div className="space-y-0.5">
              <p className="text-[10px] font-medium uppercase tracking-wider opacity-60">
                {isEditing ? "Edit Event" : "New Event"}
              </p>
              <h2 className="text-base font-semibold">{title || (isEditing ? "Untitled Event" : "Create an event")}</h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6 rounded-full -mr-1 -mt-1 opacity-60 hover:opacity-100"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          {(startDate || endDate) && (
            <p className="text-xs mt-1 opacity-70">
              {formatDateDisplay(startDate)}
              {startDate !== endDate && ` → ${formatDateDisplay(endDate)}`}
            </p>
          )}
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <FileText className="h-3 w-3" />
                Title
              </label>
              <Input
                ref={titleInputRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What's happening?"
                className="h-9 text-sm border-0 bg-muted/50 focus-visible:bg-muted focus-visible:ring-1"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add details, notes, or links..."
                className="min-h-[80px] text-sm resize-none border-0 bg-muted/50 focus-visible:bg-muted focus-visible:ring-1"
              />
            </div>

            {/* Dates */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3 w-3" />
                When
              </label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-9 text-sm border-0 bg-muted/50 focus-visible:bg-muted focus-visible:ring-1"
                  />
                </div>
                <span className="flex items-center text-muted-foreground text-xs">to</span>
                <div className="flex-1">
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-9 text-sm border-0 bg-muted/50 focus-visible:bg-muted focus-visible:ring-1"
                  />
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Tag className="h-3 w-3" />
                Category
              </label>
              <div className="flex gap-1.5 flex-wrap">
                {tags.map((tag) => {
                  const colors = TAG_COLORS[tag.color] || TAG_COLORS.blue
                  const isSelected = selectedTag === tag.id
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => setSelectedTag(tag.id)}
                      className={cn(
                        "flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-all border",
                        isSelected
                          ? cn(colors.light, "border-current")
                          : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted/50",
                      )}
                    >
                      <div className={cn("w-2 h-2 rounded-full", colors.bg)} />
                      {tag.name}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="border-t p-3 bg-muted/30">
          <div className="flex items-center gap-2">
            {isEditing && onDelete && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting || isSaving}
                className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 gap-1.5"
              >
                {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            )}
            <div className="flex-1" />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isSaving || isDeleting}
              className="h-7 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              onClick={handleSubmit}
              disabled={!title || !startDate || !endDate || isSaving || isDeleting}
              className={cn("h-7 text-xs gap-1.5", selectedTagColors?.bg, "hover:opacity-90 text-white")}
            >
              {isSaving && <Loader2 className="h-3 w-3 animate-spin" />}
              {isSaving ? "Saving..." : isEditing ? "Save Changes" : "Create Event"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
