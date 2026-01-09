import { sanityReadClient } from "@/lib/sanity"
import { NextResponse } from "next/server"

const SANITY_PROJECT_ID = "jtwugudr"
const SANITY_DATASET = "production"
const SANITY_API_VERSION = "2024-01-01"

async function sanityMutate(mutations: any[]) {
  const token = process.env.SANITY_API_TOKEN
  if (!token) {
    throw new Error("SANITY_API_TOKEN is not configured")
  }

  const url = `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/mutate/${SANITY_DATASET}`

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ mutations }),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error?.description || result.message || "Sanity mutation failed")
  }

  return result
}

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

    if (!title || !startDate || !endDate) {
      return NextResponse.json({ error: "Missing required fields: title, startDate, endDate" }, { status: 400 })
    }

    const newId = `calendarEvent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const eventDoc: Record<string, any> = {
      _id: newId,
      _type: "calendarEvent",
      title,
      description: description || "",
      startDate,
      endDate,
    }

    // Look up tag reference if provided
    if (tag) {
      try {
        const tagDoc = await sanityReadClient.fetch(`*[_type == "tag" && slug.current == $tag][0]`, { tag })
        if (tagDoc?._id) {
          eventDoc.tag = { _type: "reference", _ref: tagDoc._id }
        }
      } catch {
        // Tag lookup failed, continue without tag
      }
    }

    await sanityMutate([{ create: eventDoc }])

    return NextResponse.json({
      id: newId,
      title,
      description: description || "",
      startDate,
      endDate,
      tag: tag || "reminder",
    })
  } catch (error: any) {
    console.error("Error creating event:", error.message)
    return NextResponse.json({ error: error.message || "Failed to create event" }, { status: 500 })
  }
}
