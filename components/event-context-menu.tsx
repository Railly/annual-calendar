"use client"

import type React from "react"
import type { CalendarEvent, EventTag } from "@/lib/calendar-data"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { Pencil, Trash2, Copy, Tag, CalendarPlus, CalendarMinus } from "lucide-react"

interface EventContextMenuProps {
  event: CalendarEvent
  tags: EventTag[]
  children: React.ReactNode
  onEdit: (event: CalendarEvent) => void
  onDelete: (eventId: string) => void
  onDuplicate?: (event: CalendarEvent) => void
  onChangeTag?: (event: CalendarEvent, newTagId: string) => void
  onExtendDay?: (event: CalendarEvent) => void
  onShortenDay?: (event: CalendarEvent) => void
}

const TAG_COLORS: Record<string, string> = {
  orange: "bg-orange-500",
  teal: "bg-teal-500",
  purple: "bg-purple-500",
  green: "bg-emerald-500",
  pink: "bg-pink-500",
  blue: "bg-blue-500",
  yellow: "bg-amber-400",
  red: "bg-red-500",
}

export function EventContextMenu({
  event,
  tags,
  children,
  onEdit,
  onDelete,
  onDuplicate,
  onChangeTag,
  onExtendDay,
  onShortenDay,
}: EventContextMenuProps) {
  const eventDuration = Math.ceil((event.endDate.getTime() - event.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56">
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

        <ContextMenuSeparator />

        {onChangeTag && (
          <ContextMenuSub>
            <ContextMenuSubTrigger className="gap-2">
              <Tag className="h-4 w-4" />
              Change Tag
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-48">
              {tags.map((tag) => (
                <ContextMenuItem
                  key={tag.id}
                  onClick={() => onChangeTag(event, tag.id)}
                  className="gap-2"
                  disabled={tag.id === event.tag}
                >
                  <div className={`h-3 w-3 rounded-full ${TAG_COLORS[tag.color] || "bg-gray-500"}`} />
                  {tag.name}
                  {tag.id === event.tag && <span className="ml-auto text-xs text-muted-foreground">Current</span>}
                </ContextMenuItem>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>
        )}

        {(onExtendDay || onShortenDay) && (
          <>
            <ContextMenuSeparator />
            {onExtendDay && (
              <ContextMenuItem onClick={() => onExtendDay(event)} className="gap-2">
                <CalendarPlus className="h-4 w-4" />
                Extend +1 Day
              </ContextMenuItem>
            )}
            {onShortenDay && eventDuration > 1 && (
              <ContextMenuItem onClick={() => onShortenDay(event)} className="gap-2">
                <CalendarMinus className="h-4 w-4" />
                Shorten -1 Day
              </ContextMenuItem>
            )}
          </>
        )}

        <ContextMenuSeparator />

        <ContextMenuItem
          onClick={() => onDelete(event.id)}
          className="gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
          Delete Event
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
