import { sanityReadClient } from "@/lib/sanity"
import { NextResponse } from "next/server"
import { del } from "@vercel/blob"

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

    if (!date || !imageUrl) {
      return NextResponse.json({ error: "Date and imageUrl are required" }, { status: 400 })
    }

    // Check if photo already exists for this date
    const existingPhoto = await sanityReadClient.fetch(
      `*[_type == "dayPhoto" && date == $date][0]{ _id, externalImageUrl }`,
      { date },
    )

    if (existingPhoto?._id) {
      if (existingPhoto.externalImageUrl && existingPhoto.externalImageUrl.includes("blob.vercel-storage.com")) {
        try {
          await del(existingPhoto.externalImageUrl)
        } catch (e) {
          // Ignore blob deletion errors
        }
      }

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

      const photoDoc = {
        _id: photoId,
        _type: "dayPhoto",
        date,
        externalImageUrl: imageUrl,
        caption: caption || "",
      }

      await sanityMutate([{ create: photoDoc }])

      return NextResponse.json({ id: photoId, date, imageUrl, caption })
    }
  } catch (error) {
    console.error("Error saving photo:", error)
    return NextResponse.json({ error: "Failed to save photo" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 })
    }

    // Find the photo for this date
    const existingPhoto = await sanityReadClient.fetch(
      `*[_type == "dayPhoto" && date == $date][0]{ _id, externalImageUrl }`,
      { date },
    )

    if (!existingPhoto?._id) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 })
    }

    // Delete from Vercel Blob if it's a blob URL
    if (existingPhoto.externalImageUrl && existingPhoto.externalImageUrl.includes("blob.vercel-storage.com")) {
      try {
        await del(existingPhoto.externalImageUrl)
      } catch (e) {
        console.error("Error deleting from Blob:", e)
        // Continue to delete from Sanity even if Blob deletion fails
      }
    }

    // Delete from Sanity
    await sanityMutate([{ delete: { id: existingPhoto._id } }])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting photo:", error)
    return NextResponse.json({ error: "Failed to delete photo" }, { status: 500 })
  }
}
