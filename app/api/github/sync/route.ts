import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { fetchGitHubContributions, getContributionLevel } from "@/lib/github"

const SANITY_PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const SANITY_DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || "production"
const SANITY_API_TOKEN = process.env.SANITY_API_TOKEN

async function sanityMutate(mutations: unknown[]) {
  const res = await fetch(
    `https://${SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/data/mutate/${SANITY_DATASET}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SANITY_API_TOKEN}`,
      },
      body: JSON.stringify({ mutations }),
    }
  )
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Sanity mutation failed: ${err}`)
  }
  return res.json()
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { year } = await request.json()
    const targetYear = year || new Date().getFullYear()

    const contributions = await fetchGitHubContributions(targetYear)

    const contributionMap: Record<string, {
      date: string
      commits: number
      level: 0 | 1 | 2 | 3 | 4
      color: string
    }> = {}

    for (const week of contributions.contributionCalendar.weeks) {
      for (const day of week.contributionDays) {
        contributionMap[day.date] = {
          date: day.date,
          commits: day.contributionCount,
          level: getContributionLevel(day.contributionCount),
          color: day.color,
        }
      }
    }

    // Calculate streaks
    let longestStreak = 0
    let currentStreak = 0
    let tempStreak = 0
    const sortedDates = Object.keys(contributionMap).sort()

    for (const date of sortedDates) {
      if (contributionMap[date].commits > 0) {
        tempStreak++
        if (tempStreak > longestStreak) longestStreak = tempStreak
      } else {
        tempStreak = 0
      }
    }

    const today = new Date().toISOString().split("T")[0]
    for (let i = sortedDates.length - 1; i >= 0; i--) {
      const date = sortedDates[i]
      if (date > today) continue
      if (contributionMap[date].commits > 0) {
        currentStreak++
      } else {
        break
      }
    }

    const syncData = {
      totalCommits: contributions.totalCommitContributions,
      totalPRs: contributions.totalPullRequestContributions,
      totalReviews: contributions.totalPullRequestReviewContributions,
      totalContributions: contributions.contributionCalendar.totalContributions,
      longestStreak,
      currentStreak,
      contributions: contributionMap,
    }

    const docId = `githubSync-${userId}-${targetYear}`

    // Use createOrReplace mutation
    await sanityMutate([
      {
        createOrReplace: {
          _id: docId,
          _type: "githubSync",
          userId,
          year: targetYear,
          dataJson: JSON.stringify(syncData),
          lastSynced: new Date().toISOString(),
        },
      },
    ])

    return NextResponse.json({
      success: true,
      lastSynced: new Date().toISOString(),
      ...syncData,
    })
  } catch (error) {
    console.error("GitHub sync error:", error)
    if (error instanceof Error) {
      if (error.message.includes("Not authenticated")) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
      }
      if (error.message.includes("GitHub not connected")) {
        return NextResponse.json({ error: "GitHub not connected" }, { status: 403 })
      }
    }
    return NextResponse.json({ error: "Failed to sync GitHub data" }, { status: 500 })
  }
}
