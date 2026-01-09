"use client"

import type React from "react"
import { useState } from "react"
import { FileText, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"

interface NoteModalProps {
  isOpen: boolean
  onClose: () => void
  date: Date | null
  existingNote?: string
  onSave: (date: Date, note: string) => void
}

export function NoteModal({ isOpen, onClose, date, existingNote, onSave }: NoteModalProps) {
  const [note, setNote] = useState(existingNote || "")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!note.trim() || !date) return
    onSave(date, note)
    onClose()
  }

  const formattedDate = date?.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

  const year = date?.getFullYear()

  if (!isOpen || !date) return null

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col border-l-0 shadow-2xl">
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted rounded-lg">
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Journal Entry</h2>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                <Calendar className="h-3 w-3" />
                <span>
                  {formattedDate}, {year}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <div className="flex-1 p-6">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What's on your mind today?"
              className="w-full h-full min-h-[300px] resize-none bg-muted/30 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/20 text-sm leading-relaxed p-4 rounded-lg"
              autoFocus
            />
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-muted/20">
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!note.trim()}>
                Save Entry
              </Button>
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
