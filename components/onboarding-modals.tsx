"use client"

import React from "react"

import { useState, useEffect } from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X, Sparkles, Github, Calendar, GripVertical, ImageIcon, FileText, MessageSquare, Globe } from "lucide-react"

const GITHUB_ONBOARDING_KEY = "github-onboarding-seen"
const CALENDAR_ONBOARDING_KEY = "calendar-onboarding-seen"

export function GitHubOnboardingModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (open) {
      const seen = localStorage.getItem(GITHUB_ONBOARDING_KEY)
      if (!seen) {
        setShow(true)
      }
    }
  }, [open])

  const handleClose = () => {
    localStorage.setItem(GITHUB_ONBOARDING_KEY, "true")
    setShow(false)
    onOpenChange(false)
  }

  if (!show) return null

  return (
    <DialogPrimitive.Root open={show} onOpenChange={handleClose}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 bg-black/60 z-50 animate-in fade-in-0 duration-200" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-background border border-border rounded-xl shadow-2xl z-50 animate-in fade-in-0 zoom-in-95 duration-200 overflow-hidden">
          <DialogPrimitive.Description className="sr-only">GitHub view features overview</DialogPrimitive.Description>
          
          {/* Header with gradient */}
          <div className="relative h-24 bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzLTItMi00LTJjLTIgMC00IDItNCAyczIgNCAyIDRjMCAwIDIgMiA0IDJzNC0yIDQtMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
            <Github className="h-12 w-12 text-white" />
            <DialogPrimitive.Close asChild>
              <button className="absolute top-3 right-3 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
                <X className="h-4 w-4 text-white" />
              </button>
            </DialogPrimitive.Close>
          </div>

          <div className="p-6">
            <h2 className="text-xl font-bold text-foreground mb-1">Welcome to GitHub Year View</h2>
            <p className="text-sm text-muted-foreground mb-5">Your coding journey, visualized beautifully.</p>

            <div className="space-y-4">
              <Feature 
                icon={<Sparkles className="h-4 w-4" />}
                title="Contribution Heat Map"
                description="See your daily commits with scaled heat squares - bigger means more active."
              />
              <Feature 
                icon={<Github className="h-4 w-4" />}
                title="Repository Swimlanes"
                description="Track work sessions across repos with color-coded timeline bars."
              />
              <Feature 
                icon={<Globe className="h-4 w-4" />}
                title="Click Any Day"
                description="View detailed stats: commits, lines changed, PRs, and repos worked on."
              />
            </div>

            <button
              onClick={handleClose}
              className="w-full mt-6 py-2.5 px-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
            >
              Got it, let's go!
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

export function CalendarOnboardingModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (open) {
      const seen = localStorage.getItem(CALENDAR_ONBOARDING_KEY)
      if (!seen) {
        setShow(true)
      }
    }
  }, [open])

  const handleClose = () => {
    localStorage.setItem(CALENDAR_ONBOARDING_KEY, "true")
    setShow(false)
    onOpenChange(false)
  }

  if (!show) return null

  return (
    <DialogPrimitive.Root open={show} onOpenChange={handleClose}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 bg-black/60 z-50 animate-in fade-in-0 duration-200" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-background border border-border rounded-xl shadow-2xl z-50 animate-in fade-in-0 zoom-in-95 duration-200 overflow-hidden">
          <DialogPrimitive.Description className="sr-only">Calendar view features overview</DialogPrimitive.Description>
          
          {/* Header with gradient */}
          <div className="relative h-24 bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzLTItMi00LTJjLTIgMC00IDItNCAyczIgNCAyIDRjMCAwIDIgMiA0IDJzNC0yIDQtMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
            <Calendar className="h-12 w-12 text-white" />
            <DialogPrimitive.Close asChild>
              <button className="absolute top-3 right-3 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
                <X className="h-4 w-4 text-white" />
              </button>
            </DialogPrimitive.Close>
          </div>

          <div className="p-6">
            <h2 className="text-xl font-bold text-foreground mb-1">Welcome to Calendar View</h2>
            <p className="text-sm text-muted-foreground mb-5">Plan your year like Notion Calendar.</p>

            <div className="space-y-4">
              <Feature 
                icon={<GripVertical className="h-4 w-4" />}
                title="Drag to Create Events"
                description="Click and drag across days to create multi-day events instantly."
              />
              <Feature 
                icon={<ImageIcon className="h-4 w-4" />}
                title="Photos & Notes"
                description="Add a photo of the day or journal entry to any cell."
              />
              <Feature 
                icon={<MessageSquare className="h-4 w-4" />}
                title="AI-Powered Input"
                description='Use the dock below to add events naturally. Try: "Add holidays of my country"'
              />
            </div>

            <button
              onClick={handleClose}
              className="w-full mt-6 py-2.5 px-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
            >
              Start Planning!
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

function Feature({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}
