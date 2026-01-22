"use client"

import useSWR, { mutate } from "swr"
import { useMemo, useState, useCallback } from "react"
import { generateGitHubYearData, generateRepoSessions, type GitHubYearStats } from "@/lib/github-data"

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Failed to fetch")
  }
  return res.json()
}

interface ApiContribution {
  date: string
  commits: number
  level: 0 | 1 | 2 | 3 | 4
  color: string
}

interface GitHubApiResponse {
  totalCommits: number
  totalPRs: number
  totalReviews: number
  totalContributions: number
  longestStreak: number
  currentStreak: number
  contributions: Record<string, ApiContribution>
  lastSynced?: string
  cached?: boolean
}

export function useGitHubData(year: number) {
  const [isSyncing, setIsSyncing] = useState(false)

  const { data, error, isLoading } = useSWR<GitHubApiResponse>(
    `/api/github/contributions?year=${year}`,
    fetcher,
    {
      revalidateOnFocus: false,
      errorRetryCount: 0,
      shouldRetryOnError: false,
    }
  )

  const syncGitHub = useCallback(async () => {
    setIsSyncing(true)
    try {
      const res = await fetch("/api/github/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Sync failed")
      }
      await mutate(`/api/github/contributions?year=${year}`)
      return true
    } catch (err) {
      console.error("GitHub sync error:", err)
      return false
    } finally {
      setIsSyncing(false)
    }
  }, [year])

  const needsSync = error?.message === "No cached data. Please sync first."
  const isAuthenticated = !error || (error.message !== "Not authenticated" && !error.message.includes("Not authenticated"))
  const isConnected = !error || error.message !== "GitHub not connected"

  const githubData: GitHubYearStats = useMemo(() => {
    if (!data || error) {
      return generateGitHubYearData(year)
    }

    const contributions = new Map<string, {
      date: string
      commits: number
      prsOpened: number
      prsMerged: number
      prsClosed: number
      linesAdded: number
      linesDeleted: number
      level: 0 | 1 | 2 | 3 | 4
      repos: string[]
    }>()

    for (const [dateStr, contrib] of Object.entries(data.contributions)) {
      contributions.set(dateStr, {
        date: dateStr,
        commits: contrib.commits,
        prsOpened: 0,
        prsMerged: 0,
        prsClosed: 0,
        linesAdded: contrib.commits * 30,
        linesDeleted: contrib.commits * 10,
        level: contrib.level,
        repos: [],
      })
    }

    return {
      totalCommits: data.totalCommits,
      totalPRsOpened: data.totalPRs,
      totalPRsMerged: Math.floor(data.totalPRs * 0.8),
      totalLinesAdded: data.totalCommits * 30,
      totalLinesDeleted: data.totalCommits * 10,
      longestStreak: data.longestStreak,
      currentStreak: data.currentStreak,
      topRepos: [],
      contributions,
    }
  }, [data, error, year])

  const repoSessions = useMemo(() => {
    return generateRepoSessions(githubData.contributions)
  }, [githubData])

  return {
    githubData,
    repoSessions,
    isLoading,
    isSyncing,
    isAuthenticated,
    isConnected,
    needsSync,
    lastSynced: data?.lastSynced,
    error,
    isUsingMockData: !!error || !data,
    syncGitHub,
  }
}
