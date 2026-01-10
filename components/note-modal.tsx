"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { FileText, Calendar, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription } from "@/components/ui/sheet"
import { Drawer, DrawerContent, DrawerDescription } from "@/components/ui/drawer"
import { useMediaQuery } from "@/hooks/use-media-query"

interface NoteModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (note: string) => Promise<void>
  date: Date
  existingNote?: string
}

export function NoteModal({ isOpen, onClose, date, existingNote, onSave }: NoteModalProps) {
  const [note, setNote] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const isMobile = useMediaQuery("(max-width: 640px)")

  useEffect(() => {
    if (isOpen) {
      setNote(existingNote || "")
    }
  }, [isOpen, existingNote])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!note.trim() || isSaving) return
    setIsSaving(true)
    try {
      await onSave(note)
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  const formattedDate = date?.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

  const year = date?.getFullYear()

  const content = (
    <>
      <div className="px-4 pt-4 pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-muted rounded-md">
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Journal Entry</h2>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
              <Calendar className="h-2.5 w-2.5" />
              <span>
                {formattedDate}, {year}
              </span>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        <div className="flex-1 p-4">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What's on your mind today?"
            className="w-full h-full min-h-[200px] resize-none bg-muted/30 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/20 text-sm leading-relaxed p-3 rounded-lg"
            autoFocus
            disabled={isSaving}
          />
        </div>

        <div className="px-4 py-3 border-t bg-muted/20">
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isSaving}
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={!note.trim() || isSaving} className="h-7 text-xs">
              {isSaving ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  Saving...
                </>
              ) : (
                "Save Entry"
              )}
            </Button>
          </div>
        </div>
      </form>
    </>
  )

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="flex flex-col max-h-[90vh]">
          <DrawerDescription className="sr-only">Write a journal entry for this day</DrawerDescription>
          {content}
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col border-l-0 shadow-2xl duration-200">
        <SheetDescription className="sr-only">Write a journal entry for this day</SheetDescription>
        {content}
      </SheetContent>
    </Sheet>
  )
}
