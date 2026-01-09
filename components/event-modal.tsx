"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { X, Upload, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { CalendarEvent } from "@/lib/calendar-data"
import { cn } from "@/lib/utils"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useIsMobile } from "@/hooks/use-mobile"

interface EventModalProps {
  isOpen: boolean
  onClose: () => void
  date: Date | null
  events: CalendarEvent[]
  onAddEvent: (event: CalendarEvent) => void
  onUpdateEvent?: (event: CalendarEvent) => void
  onDeleteEvent?: (eventId: string) => void
  editEvent?: CalendarEvent | null
}

const COLORS = [
  { name: "orange", bg: "bg-orange-500" },
  { name: "teal", bg: "bg-teal-500" },
  { name: "purple", bg: "bg-purple-500" },
  { name: "green", bg: "bg-emerald-500" },
  { name: "pink", bg: "bg-pink-500" },
  { name: "blue", bg: "bg-blue-500" },
  { name: "yellow", bg: "bg-amber-400" },
  { name: "red", bg: "bg-red-500" },
]

function EventForm({
  date,
  editEvent,
  onSubmit,
  onDelete,
  onClose,
}: {
  date: Date | null
  editEvent?: CalendarEvent | null
  onSubmit: (data: {
    title: string
    description: string
    startDate: string
    endDate: string
    color: string
    image?: string
  }) => void
  onDelete?: () => void
  onClose: () => void
}) {
  const [title, setTitle] = useState(editEvent?.title || "")
  const [description, setDescription] = useState(editEvent?.description || "")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [color, setColor] = useState(editEvent?.color || "teal")
  const [imagePreview, setImagePreview] = useState<string | null>(editEvent?.image || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editEvent) {
      setStartDate(new Date(editEvent.startDate).toISOString().split("T")[0])
      setEndDate(new Date(editEvent.endDate).toISOString().split("T")[0])
    } else if (date) {
      const dateStr = date.toISOString().split("T")[0]
      setStartDate(dateStr)
      setEndDate(dateStr)
    }
  }, [date, editEvent])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !startDate || !endDate) return

    onSubmit({
      title,
      description,
      startDate,
      endDate,
      color,
      image: imagePreview || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="title">Event Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter event title..."
          className="h-11"
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add event details..."
          className="min-h-[80px] resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start">Start Date</Label>
          <Input
            id="start"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end">End Date</Label>
          <Input id="end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-11" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Color</Label>
        <div className="flex gap-2 flex-wrap">
          {COLORS.map((c) => (
            <button
              key={c.name}
              type="button"
              onClick={() => setColor(c.name)}
              className={cn(
                "w-8 h-8 rounded-full transition-all",
                c.bg,
                color === c.name ? "ring-2 ring-offset-2 ring-foreground scale-110" : "hover:scale-105",
              )}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Event Image (optional)</Label>
        <div className="flex items-center gap-3">
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2">
            <Upload className="h-4 w-4" />
            Upload Image
          </Button>
          {imagePreview && (
            <div className="relative w-16 h-16 rounded-lg overflow-hidden border">
              <img src={imagePreview || "/placeholder.svg"} alt="Preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setImagePreview(null)}
                className="absolute top-0 right-0 p-0.5 bg-black/50 rounded-bl text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        {editEvent && onDelete && (
          <Button type="button" variant="destructive" onClick={onDelete} className="gap-2">
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        )}
        <div className="flex-1" />
        <Button type="button" variant="outline" onClick={onClose} className="bg-transparent">
          Cancel
        </Button>
        <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white">
          {editEvent ? "Update" : "Create"} Event
        </Button>
      </div>
    </form>
  )
}

export function EventModal({
  isOpen,
  onClose,
  date,
  events,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  editEvent,
}: EventModalProps) {
  const isMobile = useIsMobile()

  const handleSubmit = (data: {
    title: string
    description: string
    startDate: string
    endDate: string
    color: string
    image?: string
  }) => {
    const eventData = {
      id: editEvent?.id || crypto.randomUUID(),
      title: data.title,
      description: data.description,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      color: data.color,
      image: data.image,
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

  if (!isOpen) return null

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{editEvent ? "Edit Event" : "Create Event"}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6">
            <EventForm
              date={date}
              editEvent={editEvent}
              onSubmit={handleSubmit}
              onDelete={editEvent ? handleDelete : undefined}
              onClose={onClose}
            />
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editEvent ? "Edit Event" : "Create Event"}</DialogTitle>
        </DialogHeader>
        <EventForm
          date={date}
          editEvent={editEvent}
          onSubmit={handleSubmit}
          onDelete={editEvent ? handleDelete : undefined}
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  )
}
