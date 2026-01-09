"use client"

import type React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import type { CalendarEvent, EventTag } from "@/lib/calendar-data"
import { cn } from "@/lib/utils"

const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  orange: { bg: "bg-orange-100", text: "text-orange-700" },
  teal: { bg: "bg-teal-100", text: "text-teal-700" },
  purple: { bg: "bg-purple-100", text: "text-purple-700" },
  green: { bg: "bg-emerald-100", text: "text-emerald-700" },
  pink: { bg: "bg-pink-100", text: "text-pink-700" },
  blue: { bg: "bg-blue-100", text: "text-blue-700" },
  yellow: { bg: "bg-amber-100", text: "text-amber-700" },
  red: { bg: "bg-red-100", text: "text-red-700" },
}

interface EventTooltipProps {
  event: CalendarEvent
  tags: EventTag[]
  children: React.ReactNode
}

export function EventTooltip({ event, tags, children }: EventTooltipProps) {
  const startDate = new Date(event.startDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
  const endDate = new Date(event.endDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
  const isSingleDay = startDate === endDate

  const tag = tags.find((t) => t.id === event.tag)
  const tagColors = tag ? TAG_COLORS[tag.color] || TAG_COLORS.blue : null

  return (
    <TooltipPrimitive.Provider delayDuration={800} skipDelayDuration={300}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side="top"
            align="center"
            sideOffset={8}
            className="z-[9999] max-w-[280px] p-3 bg-white text-foreground border border-gray-200 shadow-xl rounded-lg animate-in fade-in-0 zoom-in-95 duration-150"
          >
            <p className="font-semibold text-sm mb-1 text-gray-900">{event.title}</p>
            <div className="flex items-center gap-2 mb-2">
              <p className="text-xs text-gray-500">{isSingleDay ? startDate : `${startDate} - ${endDate}`}</p>
              {tag && (
                <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded", tagColors?.bg, tagColors?.text)}>
                  {tag.name}
                </span>
              )}
            </div>
            {event.description && <p className="text-xs text-gray-600 leading-relaxed">{event.description}</p>}
            <TooltipPrimitive.Arrow className="fill-white drop-shadow-sm" width={12} height={6} />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}
