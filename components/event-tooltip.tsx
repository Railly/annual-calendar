"use client"

import type React from "react"

import type { CalendarEvent } from "@/lib/calendar-data"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface EventTooltipProps {
  event: CalendarEvent
  children: React.ReactNode
}

export function EventTooltip({ event, children }: EventTooltipProps) {
  const startDate = new Date(event.startDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
  const endDate = new Date(event.endDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
  const isSingleDay = startDate === endDate

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent
          side="top"
          sideOffset={12}
          className="max-w-[280px] p-3 !bg-white text-foreground border border-gray-200 shadow-xl rounded-lg"
        >
          <p className="font-bold text-sm mb-1 text-gray-900">{event.title}</p>
          <p className="text-xs text-gray-500 mb-2">{isSingleDay ? startDate : `${startDate} - ${endDate}`}</p>
          {event.description && <p className="text-xs text-gray-600 leading-relaxed">{event.description}</p>}
          <div
            className="absolute left-1/2 -translate-x-1/2 -bottom-2"
            style={{
              width: 0,
              height: 0,
              borderLeft: "8px solid transparent",
              borderRight: "8px solid transparent",
              borderTop: "8px solid white",
              filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.1))",
            }}
          />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
