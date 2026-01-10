"use client"

import { useState, useCallback, useMemo } from "react"
import useSWR, { mutate } from "swr"
import type { CalendarEvent, EventTag } from "@/lib/calendar-data"
import { defaultTags, parseDateString } from "@/lib/calendar-data"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function useSanityCalendar() {
  const [isOnline, setIsOnline] = useState(true)

  // Fetch tags from Sanity
  const { data: sanityTags, error: tagsError } = useSWR<EventTag[]>("/api/tags", fetcher, {
    fallbackData: defaultTags,
    revalidateOnFocus: false,
  })

  // Fetch events from Sanity
  const {
    data: sanityEvents,
    error: eventsError,
    isLoading,
  } = useSWR<any[]>("/api/events", fetcher, {
    revalidateOnFocus: false,
  })

  const { data: sanityNotes } = useSWR<any[]>("/api/notes", fetcher, {
    revalidateOnFocus: false,
  })

  const { data: sanityPhotos } = useSWR<any[]>("/api/photos", fetcher, {
    revalidateOnFocus: false,
  })

  const tags = tagsError ? defaultTags : sanityTags || defaultTags

  const events: CalendarEvent[] = useMemo(() => {
    if (!sanityEvents) return []
    return sanityEvents.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      startDate: parseDateString(event.startDate),
      endDate: parseDateString(event.endDate),
      tag: event.tag,
    }))
  }, [sanityEvents])

  const notes = useMemo(() => {
    const map = new Map<string, string>()
    if (sanityNotes) {
      for (const note of sanityNotes) {
        if (note.date && note.content) {
          map.set(note.date, note.content)
        }
      }
    }
    return map
  }, [sanityNotes])

  const photos = useMemo(() => {
    const map = new Map<string, string>()
    if (sanityPhotos) {
      for (const photo of sanityPhotos) {
        if (photo.date) {
          // Use externalImageUrl or imageUrl
          const url = photo.externalImageUrl || photo.imageUrl
          if (url) {
            map.set(photo.date, url)
          }
        }
      }
    }
    return map
  }, [sanityPhotos])

  // Create event
  const createEvent = useCallback(async (event: Omit<CalendarEvent, "id">) => {
    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: event.title,
          description: event.description,
          startDate: event.startDate.toISOString().split("T")[0],
          endDate: event.endDate.toISOString().split("T")[0],
          tag: event.tag,
        }),
      })

      if (!response.ok) throw new Error("Failed to create event")

      const newEvent = await response.json()
      mutate("/api/events")
      return newEvent
    } catch (error) {
      console.error("Error creating event:", error)
      throw error
    }
  }, [])

  // Update event
  const updateEvent = useCallback(async (event: CalendarEvent) => {
    try {
      const response = await fetch(`/api/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: event.title,
          description: event.description,
          startDate: event.startDate.toISOString().split("T")[0],
          endDate: event.endDate.toISOString().split("T")[0],
          tag: event.tag,
        }),
      })

      if (!response.ok) throw new Error("Failed to update event")

      mutate("/api/events")
    } catch (error) {
      console.error("Error updating event:", error)
      throw error
    }
  }, [])

  // Delete event
  const deleteEvent = useCallback(async (eventId: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete event")

      mutate("/api/events")
    } catch (error) {
      console.error("Error deleting event:", error)
      throw error
    }
  }, [])

  const saveNote = useCallback(async (date: string, content: string) => {
    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, content }),
      })

      if (!response.ok) throw new Error("Failed to save note")

      mutate("/api/notes")
      return await response.json()
    } catch (error) {
      console.error("Error saving note:", error)
      throw error
    }
  }, [])

  const savePhoto = useCallback(async (date: string, imageUrl: string, caption?: string) => {
    try {
      const response = await fetch("/api/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, imageUrl, caption }),
      })

      if (!response.ok) throw new Error("Failed to save photo")

      mutate("/api/photos")
      return await response.json()
    } catch (error) {
      console.error("Error saving photo:", error)
      throw error
    }
  }, [])

  return {
    events,
    tags,
    notes,
    photos,
    isLoading,
    isOnline,
    createEvent,
    updateEvent,
    deleteEvent,
    saveNote,
    savePhoto,
  }
}
