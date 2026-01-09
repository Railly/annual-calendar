import { sanityClient, sanityReadClient } from "@/lib/sanity"
import { NextResponse } from "next/server"

// GET all events
export async function GET() {
  try {
    const events = await sanityReadClient.fetch(`
      *[_type == "calendarEvent"] {
        _id,
        title,
        description,
        startDate,
        endDate,
        "tag": tag->slug.current
      } | order(startDate asc)
    `)

    const formattedEvents = events.map((event: any) => ({
      id: event._id,
      title: event.title,
      description: event.description || "",
      startDate: event.startDate,
      endDate: event.endDate,
      tag: event.tag || "reminder",
    }))

    return NextResponse.json(formattedEvents)
  } catch (error) {
    console.error("Error fetching events:", error)
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 })
  }
}

// POST create new event
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, description, startDate, endDate, tag } = body

    // Find the tag reference
    const tagDoc = await sanityReadClient.fetch(`*[_type == "tag" && slug.current == $tag][0]._id`, { tag })

    const newEvent = await sanityClient.create({
      _type: "calendarEvent",
      title,
      description,
      startDate,
      endDate,
      tag: tagDoc ? { _type: "reference", _ref: tagDoc } : undefined,
    })

    return NextResponse.json({
      id: newEvent._id,
      title: newEvent.title,
      description: newEvent.description,
      startDate: newEvent.startDate,
      endDate: newEvent.endDate,
      tag,
    })
  } catch (error) {
    console.error("Error creating event:", error)
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 })
  }
}
