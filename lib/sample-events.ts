import type { CalendarEvent } from "./calendar-data"

function localDate(year: number, month: number, day: number): Date {
  return new Date(year, month, day, 12, 0, 0, 0)
}

// Sample events for 2026 with descriptions - kept for reference/demo purposes
export const sampleEvents: CalendarEvent[] = [
  // January
  {
    id: "1",
    title: "New Year's Day",
    description: "Ring in 2026 with family and friends. Traditional midnight countdown followed by brunch.",
    startDate: localDate(2026, 0, 1),
    endDate: localDate(2026, 0, 1),
    tag: "holiday",
  },
  {
    id: "2",
    title: "Family in DC",
    description: "Visiting the Smithsonian museums, National Mall, and catching up with cousins in Georgetown.",
    startDate: localDate(2026, 0, 4),
    endDate: localDate(2026, 0, 8),
    tag: "travel",
  },
  {
    id: "3",
    title: "Martin Luther King Jr. Day",
    description: "Federal holiday honoring the civil rights leader. Community service event at local food bank.",
    startDate: localDate(2026, 0, 19),
    endDate: localDate(2026, 0, 19),
    tag: "holiday",
  },
  {
    id: "4",
    title: "Lean in CA",
    description: "Leadership conference in San Francisco. Keynote by Sheryl Sandberg, networking events planned.",
    startDate: localDate(2026, 0, 16),
    endDate: localDate(2026, 0, 18),
    tag: "work",
  },
  // February
  {
    id: "5",
    title: "Galentine's",
    description: "Girls' night out! Dinner at the new Italian place downtown, followed by a spa evening.",
    startDate: localDate(2026, 1, 1),
    endDate: localDate(2026, 1, 1),
    tag: "family",
  },
  {
    id: "6",
    title: "Valentine's Day",
    description: "Reservations at Eleven Madison Park. Anniversary celebration - 5 years!",
    startDate: localDate(2026, 1, 14),
    endDate: localDate(2026, 1, 14),
    tag: "important",
  },
  {
    id: "7",
    title: "Presidents' Day",
    description: "Federal holiday. Planning a day trip to the mountains if weather permits.",
    startDate: localDate(2026, 1, 16),
    endDate: localDate(2026, 1, 16),
    tag: "holiday",
  },
  {
    id: "8",
    title: "School Closed - Midwinter Recess",
    description: "Kids are off school for the week. Planning activities: museum visit, ice skating, movie marathon.",
    startDate: localDate(2026, 1, 16),
    endDate: localDate(2026, 1, 20),
    tag: "school",
  },
  // More events can be added here for demo purposes
]
