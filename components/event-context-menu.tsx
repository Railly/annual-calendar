"use client"

import type React from "react"

import type { CalendarEvent } from "@/lib/calendar-data"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu"
import { Pencil, Trash2, Copy } from "lucide-react"

interface EventContextMenuProps {
  event: CalendarEvent
  children: React.ReactNode
  onEdit: (event: CalendarEvent) => void
  onDelete: (eventId: string) => void
  onDuplicate?: (event: CalendarEvent) => void
}

export function EventContextMenu({ event, children, onEdit, onDelete, onDuplicate }: EventContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={() => onEdit(event)} className="gap-2">
          <Pencil className="h-4 w-4" />
          Edit Event
        </ContextMenuItem>
        {onDuplicate && (
          <ContextMenuItem onClick={() => onDuplicate(event)} className="gap-2">
            <Copy className="h-4 w-4" />
            Duplicate
          </ContextMenuItem>
        )}
        <ContextMenuItem onClick={() => onDelete(event.id)} className="gap-2 text-destructive focus:text-destructive">
          <Trash2 className="h-4 w-4" />
          Delete Event
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
