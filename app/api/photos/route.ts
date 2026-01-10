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
    const photos = await sanityReadClient.fetch(`
      *[_type == "dayPhoto"] {
        "id": _id,
        date,
        "imageUrl": coalesce(externalImageUrl, image.asset->url),
        caption
      }
    `)

    return NextResponse.json(photos)
  } catch (error) {
    console.error("Error fetching photos:", error)
    return NextResponse.json({ error: "Failed to fetch photos" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { date, imageUrl, caption } = body

    console.log("[v0] POST /api/photos called with:", { date, imageUrl, caption })

    if (!date || !imageUrl) {
      return NextResponse.json({ error: "Date and imageUrl are required" }, { status: 400 })
    }

    // Check if photo already exists for this date
    const existingPhoto = await sanityReadClient.fetch(`*[_type == "dayPhoto" && date == $date][0]{ _id }`, { date })

    console.log("[v0] Existing photo for date:", existingPhoto)

    if (existingPhoto?._id) {
      console.log("[v0] Updating existing photo:", existingPhoto._id)
      await sanityMutate([
        {
          patch: {
            id: existingPhoto._id,
            set: { externalImageUrl: imageUrl, caption: caption || "" },
          },
        },
      ])

      return NextResponse.json({ id: existingPhoto._id, date, imageUrl, caption })
    } else {
      const photoId = `dayPhoto-${date.replace(/-/g, "")}`
      console.log("[v0] Creating new photo with ID:", photoId)

      const photoDoc = {
        _id: photoId,
        _type: "dayPhoto",
        date,
        externalImageUrl: imageUrl,
        caption: caption || "",
      }

      console.log("[v0] Photo document:", photoDoc)

      const result = await sanityMutate([{ create: photoDoc }])
      console.log("[v0] Sanity mutation result:", result)

      return NextResponse.json({ id: photoId, date, imageUrl, caption })
    }
  } catch (error) {
    console.error("[v0] Error saving photo:", error)
    return NextResponse.json({ error: "Failed to save photo" }, { status: 500 })
  }
}
