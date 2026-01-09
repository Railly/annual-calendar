"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { cn } from "@/lib/utils"
import type { EventTag } from "@/lib/calendar-data"

interface ParsedEvent {
  title: string
  description?: string
  startDate: string
  endDate: string
  tag: string
}

interface AIDockProps {
  tags: EventTag[]
  onAddEvents: (events: { title: string; description?: string; startDate: Date; endDate: Date; tag: string }[]) => void
}

export function AIDock({ tags, onAddEvents }: AIDockProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (!input.trim() && !isLoading) {
          setIsExpanded(false)
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [input, isLoading])

  useEffect(() => {
    if (isExpanded && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isExpanded])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [input])

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/parse-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: input, year: 2026 }),
      })

      if (!response.ok) throw new Error("Failed to parse events")

      const data = await response.json()
      if (data.events && data.events.length > 0) {
        const eventsWithDates = data.events.map((event: ParsedEvent) => ({
          title: event.title,
          description: event.description,
          startDate: new Date(event.startDate + "T12:00:00"),
          endDate: new Date(event.endDate + "T12:00:00"),
          tag: event.tag,
        }))
        onAddEvents(eventsWithDates)
        setInput("")
        setIsExpanded(false)
      }
    } catch (error) {
      console.error("Error parsing events:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
    if (e.key === "Escape") {
      setIsExpanded(false)
      setInput("")
    }
  }

  return (
    <div ref={containerRef} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <motion.div
        layout
        initial={false}
        animate={{
          width: isExpanded ? 500 : 320,
          borderRadius: isExpanded ? 16 : 9999,
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 35,
        }}
        className={cn(
          "bg-background border border-border shadow-lg overflow-hidden relative",
          isLoading && "shimmer-loading",
        )}
      >
        <motion.div layout="position" className="relative">
          {isExpanded ? (
            <motion.textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add events with natural language..."
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className={cn(
                "w-full bg-transparent px-4 py-3 text-sm resize-none focus:outline-none",
                "placeholder:text-muted-foreground/60",
                isLoading && "opacity-60",
              )}
              style={{ minHeight: 44 }}
              disabled={isLoading}
            />
          ) : (
            <motion.button
              onClick={() => setIsExpanded(true)}
              className="w-full text-left px-4 py-3 text-sm text-muted-foreground/60 hover:text-muted-foreground transition-colors"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              Add events with AI...
            </motion.button>
          )}
        </motion.div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-3 flex items-center justify-between border-t border-border/50 pt-2">
                <span className="text-[10px] text-muted-foreground">Enter to add · Esc to cancel</span>
                <button
                  onClick={handleSubmit}
                  disabled={isLoading || !input.trim()}
                  className={cn(
                    "text-xs font-medium transition-colors",
                    input.trim() ? "text-primary hover:text-primary/80" : "text-muted-foreground/40",
                    "disabled:opacity-50",
                  )}
                >
                  {isLoading ? "Adding..." : "Add"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
