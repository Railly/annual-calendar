export interface EventTag {
  id: string
  name: string
  color: string
}

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  startDate: Date
  endDate: Date
  tag: string
  image?: string
}

export interface DayNote {
  id: string
  date: Date
  content: string
}

export interface DayImage {
  date: string
  imageUrl: string
}

export const defaultTags: EventTag[] = [
  { id: "travel", name: "Travel", color: "teal" },
  { id: "holiday", name: "Holiday", color: "orange" },
  { id: "family", name: "Family", color: "green" },
  { id: "work", name: "Work", color: "blue" },
  { id: "school", name: "School", color: "purple" },
  { id: "birthday", name: "Birthday", color: "pink" },
  { id: "reminder", name: "Reminder", color: "yellow" },
  { id: "important", name: "Important", color: "red" },
]

export function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number)
  return new Date(year, month - 1, day, 12, 0, 0, 0)
}
