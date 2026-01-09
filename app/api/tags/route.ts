import { sanityReadClient } from "@/lib/sanity"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const tags = await sanityReadClient.fetch(`
      *[_type == "tag"] {
        "id": slug.current,
        name,
        color
      } | order(name asc)
    `)

    // Map hex colors to our color system
    const colorMap: Record<string, string> = {
      "#10b981": "green",
      "#f97316": "orange",
      "#14b8a6": "teal",
      "#3b82f6": "blue",
      "#a855f7": "purple",
      "#ec4899": "pink",
      "#eab308": "yellow",
      "#ef4444": "red",
    }

    const formattedTags = tags.map((tag: any) => ({
      id: tag.id,
      name: tag.name,
      color: colorMap[tag.color] || "blue",
    }))

    return NextResponse.json(formattedTags)
  } catch (error) {
    console.error("Error fetching tags:", error)
    return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 })
  }
}
