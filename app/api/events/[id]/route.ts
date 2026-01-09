import { sanityClient, sanityReadClient } from "@/lib/sanity"
import { NextResponse } from "next/server"

// PATCH update event
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { title, description, startDate, endDate, tag } = body

    // Find the tag reference
    const tagDoc = await sanityReadClient.fetch(`*[_type == "tag" && slug.current == $tag][0]._id`, { tag })

    const updatedEvent = await sanityClient
      .patch(id)
      .set({
        title,
        description,
        startDate,
        endDate,
        tag: tagDoc ? { _type: "reference", _ref: tagDoc } : undefined,
      })
      .commit()

    return NextResponse.json({
      id: updatedEvent._id,
      title: updatedEvent.title,
      description: updatedEvent.description,
      startDate: updatedEvent.startDate,
      endDate: updatedEvent.endDate,
      tag,
    })
  } catch (error) {
    console.error("Error updating event:", error)
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 })
  }
}

// DELETE event
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await sanityClient.delete(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting event:", error)
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 })
  }
}
