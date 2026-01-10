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

// PATCH update event
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { title, description, startDate, endDate, tag } = body

    const patchSet: Record<string, any> = {
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
          patchSet.tag = { _type: "reference", _ref: tagDoc._id }
        }
      } catch {
        // Tag lookup failed, continue without updating tag
      }
    }

    await sanityMutate([
      {
        patch: {
          id,
          set: patchSet,
        },
      },
    ])

    return NextResponse.json({
      id,
      title,
      description: description || "",
      startDate,
      endDate,
      tag: tag || "reminder",
    })
  } catch (error: any) {
    console.error("Error updating event:", error.message)
    return NextResponse.json({ error: error.message || "Failed to update event" }, { status: 500 })
  }
}

// DELETE event
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    await sanityMutate([{ delete: { id } }])

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting event:", error.message)
    return NextResponse.json({ error: error.message || "Failed to delete event" }, { status: 500 })
  }
}
