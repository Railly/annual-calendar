import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { sanityReadClient } from "@/lib/sanity"

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString())

    const docId = `githubSync-${userId}-${year}`
    const cachedData = await sanityReadClient.fetch(
      `*[_type == "githubSync" && _id == $docId][0]{ dataJson, lastSynced }`,
      { docId }
    )

    if (cachedData?.dataJson) {
      const data = JSON.parse(cachedData.dataJson)
      return NextResponse.json({
        ...data,
        lastSynced: cachedData.lastSynced,
        cached: true,
      })
    }

    return NextResponse.json({ error: "No cached data. Please sync first." }, { status: 404 })
  } catch (error) {
    console.error("GitHub API error:", error)
    if (error instanceof Error) {
      if (error.message.includes("Not authenticated")) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
      }
    }
    return NextResponse.json({ error: "Failed to fetch contributions" }, { status: 500 })
  }
}
