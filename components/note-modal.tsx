"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useIsMobile } from "@/hooks/use-mobile"

interface NoteModalProps {
  isOpen: boolean
  onClose: () => void
  date: Date | null
  existingNote?: string
  onSave: (date: Date, note: string) => void
}

function NoteForm({
  date,
  existingNote,
  onSave,
  onClose,
}: {
  date: Date | null
  existingNote?: string
  onSave: (note: string) => void
  onClose: () => void
}) {
  const [note, setNote] = useState(existingNote || "")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!note.trim()) return
    onSave(note)
  }

  const formattedDate = date?.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-muted-foreground">{formattedDate}</p>
      <div className="space-y-2">
        <Label htmlFor="note">Journal Entry</Label>
        <Textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Write your thoughts..."
          className="min-h-[150px] resize-none"
          autoFocus
        />
      </div>
      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white">
          Save Note
        </Button>
      </div>
    </form>
  )
}

export function NoteModal({ isOpen, onClose, date, existingNote, onSave }: NoteModalProps) {
  const isMobile = useIsMobile()

  const handleSave = (note: string) => {
    if (date) {
      onSave(date, note)
    }
    onClose()
  }

  if (!isOpen || !date) return null

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Add Note</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6">
            <NoteForm date={date} existingNote={existingNote} onSave={handleSave} onClose={onClose} />
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Note</DialogTitle>
        </DialogHeader>
        <NoteForm date={date} existingNote={existingNote} onSave={handleSave} onClose={onClose} />
      </DialogContent>
    </Dialog>
  )
}
