import { sanityReadClient } from "@/lib/sanity"
import { NextResponse } from "next/server"

const SANITY_PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "jtwugudr"
const SANITY_DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || "production"
const SANITY_API_VERSION = "2024-01-01"
const SANITY_TOKEN = process.env.SANITY_API_TOKEN

async function sanityMutate(mutations: any[]) {
  const response = await fetch(
    `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/mutate/${SANITY_DATASET}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SANITY_TOKEN}`,
      },
      body: JSON.stringify({ mutations }),
    },
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Sanity mutation failed: ${errorText}`)
  }

  return response.json()
}

export async function GET() {
  try {
    const notes = await sanityReadClient.fetch(`
      *[_type == "dayNote"] {
        "id": _id,
        date,
        content
      }
    `)

    return NextResponse.json(notes)
  } catch (error) {
    console.error("Error fetching notes:", error)
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { date, content } = body

    if (!date || !content) {
      return NextResponse.json({ error: "Date and content are required" }, { status: 400 })
    }

    // Check if note already exists for this date
    const existingNote = await sanityReadClient.fetch(`*[_type == "dayNote" && date == $date][0]{ _id }`, { date })

    if (existingNote?._id) {
      // Update existing note
      await sanityMutate([
        {
          patch: {
            id: existingNote._id,
            set: { content },
          },
        },
      ])

      return NextResponse.json({ id: existingNote._id, date, content })
    } else {
      // Create new note
      const noteId = `dayNote-${date}`
      await sanityMutate([
        {
          create: {
            _id: noteId,
            _type: "dayNote",
            date,
            content,
          },
        },
      ])

      return NextResponse.json({ id: noteId, date, content })
    }
  } catch (error) {
    console.error("Error saving note:", error)
    return NextResponse.json({ error: "Failed to save note" }, { status: 500 })
  }
}
