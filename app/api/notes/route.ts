import { sanityClient, sanityReadClient } from "@/lib/sanity"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const notes = await sanityReadClient.fetch(`
      *[_type == "dayNote"] {
        _id,
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

    // Check if note already exists for this date
    const existingNote = await sanityReadClient.fetch(`*[_type == "dayNote" && date == $date][0]._id`, { date })

    let note
    if (existingNote) {
      note = await sanityClient.patch(existingNote).set({ content }).commit()
    } else {
      note = await sanityClient.create({
        _type: "dayNote",
        date,
        content,
      })
    }

    return NextResponse.json(note)
  } catch (error) {
    console.error("Error saving note:", error)
    return NextResponse.json({ error: "Failed to save note" }, { status: 500 })
  }
}
