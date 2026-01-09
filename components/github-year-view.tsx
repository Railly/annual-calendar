"use client"

import type React from "react"

import { useMemo, useRef, useState } from "react"
import {
  GitCommit,
  GitPullRequest,
  GitMerge,
  Plus,
  Minus,
  Flame,
  Trophy,
  Code2,
  X,
  FileCode,
  BarChart3,
} from "lucide-react"
import { useTheme } from "next-themes"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import {
  generateGitHubYearData,
  generateRepoSessions,
  getContributionBg,
  type DayContribution,
  type RepoWorkSession,
} from "@/lib/github-data"
import { cn } from "@/lib/utils"

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]
const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]
const COLS = 21
const ROWS = 18
const MAX_SWIMLANES_PER_ROW = 2

const REPO_COLORS: Record<string, { borderColor: string; lightFill: string; textDark: string; textLight: string }> = {
  "annual-calendar-2026": {
    borderColor: "#3b82f6",
    lightFill: "rgba(59,130,246,0.15)",
    textDark: "#1e40af",
    textLight: "#ffffff",
  },
  "sanity-cms-integration": {
    borderColor: "#f97316",
    lightFill: "rgba(249,115,22,0.15)",
    textDark: "#c2410c",
    textLight: "#ffffff",
  },
  "ai-event-parser": {
    borderColor: "#a855f7",
    lightFill: "rgba(168,85,247,0.15)",
    textDark: "#7c3aed",
    textLight: "#ffffff",
  },
  "nextjs-starter": {
    borderColor: "#10b981",
    lightFill: "rgba(16,185,129,0.15)",
    textDark: "#047857",
    textLight: "#ffffff",
  },
  "design-system": {
    borderColor: "#ec4899",
    lightFill: "rgba(236,72,153,0.15)",
    textDark: "#be185d",
    textLight: "#ffffff",
  },
  "api-gateway": {
    borderColor: "#14b8a6",
    lightFill: "rgba(20,184,166,0.15)",
    textDark: "#0f766e",
    textLight: "#ffffff",
  },
  "mobile-app": {
    borderColor: "#ef4444",
    lightFill: "rgba(239,68,68,0.15)",
    textDark: "#dc2626",
    textLight: "#ffffff",
  },
  "docs-site": {
    borderColor: "#f59e0b",
    lightFill: "rgba(245,158,11,0.15)",
    textDark: "#92400e",
    textLight: "#000000",
  },
}

function getRepoColor(repo: string) {
  return (
    REPO_COLORS[repo] || {
      borderColor: "#6b7280",
      lightFill: "rgba(107,114,128,0.15)",
      textDark: "#4b5563",
      textLight: "#ffffff",
    }
  )
}

function isPastDay(date: Date) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const checkDate = new Date(date)
  checkDate.setHours(0, 0, 0, 0)
  return checkDate < today
}

function isToday(date: Date) {
  const today = new Date()
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  )
}

function formatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "k"
  }
  return num.toString()
}

// ... existing GitHubDayTooltip component ...
function GitHubDayTooltip({
  children,
  date,
  contribution,
}: {
  children: React.ReactNode
  date: Date
  contribution: DayContribution | null
}) {
  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side="top"
          sideOffset={8}
          className="z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl px-4 py-3 max-w-xs animate-in fade-in-0 zoom-in-95 duration-150"
        >
          <TooltipPrimitive.Arrow className="fill-white dark:fill-zinc-900" width={12} height={6} />
          <p className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm mb-2">{formattedDate}</p>

          {contribution && contribution.commits > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <GitCommit className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">{contribution.commits} commits</span>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <span className="text-green-600 dark:text-green-400">+{contribution.linesAdded} lines</span>
                <span className="text-red-600 dark:text-red-400">-{contribution.linesDeleted} lines</span>
              </div>

              {(contribution.prsOpened > 0 || contribution.prsMerged > 0) && (
                <div className="flex items-center gap-3 text-xs pt-1 border-t border-zinc-200 dark:border-zinc-700">
                  {contribution.prsOpened > 0 && (
                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <GitPullRequest className="h-3 w-3" />
                      {contribution.prsOpened} opened
                    </span>
                  )}
                  {contribution.prsMerged > 0 && (
                    <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                      <GitMerge className="h-3 w-3" />
                      {contribution.prsMerged} merged
                    </span>
                  )}
                </div>
              )}

              {contribution.repos.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 pt-1 border-t border-zinc-200 dark:border-zinc-700">
                  <FileCode className="h-3 w-3" />
                  <span className="truncate">{contribution.repos.join(", ")}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No contributions</p>
          )}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}

// ... existing SessionDetailSheet component ...
function SessionDetailSheet({
  session,
  open,
  onClose,
}: {
  session: RepoWorkSession | null
  open: boolean
  onClose: () => void
}) {
  if (!session) return null

  const startDate = new Date(session.startDate + "T12:00:00")
  const endDate = new Date(session.endDate + "T12:00:00")
  const days = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

  let peakCommits = 0
  let peakDate = session.startDate
  session.dailyCommits.forEach((commits, date) => {
    if (commits > peakCommits) {
      peakCommits = commits
      peakDate = date
    }
  })

  const dailyBreakdown = Array.from(session.dailyCommits.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, commits]) => ({
      date: new Date(date + "T12:00:00"),
      commits,
    }))

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 bg-black/40 z-50 animate-in fade-in-0 duration-200" />
        <DialogPrimitive.Content className="fixed right-0 top-0 h-full w-full max-w-md bg-background border-l border-border shadow-2xl z-50 animate-in slide-in-from-right duration-300 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: session.color }} />
                <div>
                  <h2 className="text-xl font-bold text-foreground">{session.repo}</h2>
                  <p className="text-sm text-muted-foreground">
                    {startDate.toLocaleDateString("en-US", { month: "long", day: "numeric" })} -{" "}
                    {endDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              </div>
              <DialogPrimitive.Close asChild>
                <button className="p-2 rounded-md hover:bg-muted transition-colors">
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </DialogPrimitive.Close>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-1">
                  <GitCommit className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm text-muted-foreground">Total Commits</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{session.totalCommits}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-1">
                  <Code2 className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Active Days</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{days}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-1">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-muted-foreground">Peak Day</span>
                </div>
                <p className="text-lg font-bold text-foreground">{peakCommits} commits</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(peakDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-muted-foreground">Avg/Day</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{(session.totalCommits / days).toFixed(1)}</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Daily Activity</h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {dailyBreakdown.map(({ date, commits }) => {
                  const intensity = commits / peakCommits
                  return (
                    <div key={date.toISOString()} className="flex items-center gap-3 py-2 border-b border-border/30">
                      <span className="text-xs text-muted-foreground w-20">
                        {date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      </span>
                      <div className="flex-1 h-4 bg-muted rounded overflow-hidden">
                        <div
                          className="h-full rounded transition-all"
                          style={{
                            width: `${intensity * 100}%`,
                            backgroundColor: session.color,
                            opacity: 0.3 + intensity * 0.7,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-foreground w-16 text-right">{commits} commits</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

export function StatsDialog({ year }: { year: number }) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  const githubData = useMemo(() => generateGitHubYearData(year), [year])

  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Trigger asChild>
        <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <BarChart3 className="h-3.5 w-3.5" />
          Stats
        </button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 bg-black/40 z-50 animate-in fade-in-0 duration-200" />
        <DialogPrimitive.Content className="fixed right-0 top-0 h-full w-full max-w-sm bg-background border-l border-border shadow-2xl z-50 animate-in slide-in-from-right duration-300 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">Year in Code</h2>
              <DialogPrimitive.Close asChild>
                <button className="p-2 rounded-md hover:bg-muted transition-colors">
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </DialogPrimitive.Close>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-1">
                  <GitCommit className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm text-muted-foreground">Total Commits</span>
                </div>
                <p className="text-3xl font-bold text-foreground">{formatNumber(githubData.totalCommits)}</p>
              </div>

              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-1">
                  <GitMerge className="h-4 w-4 text-purple-500" />
                  <span className="text-sm text-muted-foreground">PRs Merged</span>
                </div>
                <p className="text-3xl font-bold text-foreground">{githubData.totalPRsMerged}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Plus className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-muted-foreground">Lines Added</span>
                  </div>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">
                    {formatNumber(githubData.totalLinesAdded)}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Minus className="h-4 w-4 text-red-500" />
                    <span className="text-xs text-muted-foreground">Lines Deleted</span>
                  </div>
                  <p className="text-xl font-bold text-red-600 dark:text-red-400">
                    {formatNumber(githubData.totalLinesDeleted)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Flame className="h-4 w-4 text-orange-500" />
                    <span className="text-xs text-muted-foreground">Current Streak</span>
                  </div>
                  <p className="text-xl font-bold text-foreground">{githubData.currentStreak} days</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    <span className="text-xs text-muted-foreground">Longest Streak</span>
                  </div>
                  <p className="text-xl font-bold text-foreground">{githubData.longestStreak} days</p>
                </div>
              </div>

              {/* Contribution legend */}
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-2">Contribution Levels</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Less</span>
                  {[0, 1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className="w-4 h-4 rounded-sm"
                      style={{ backgroundColor: getContributionBg(level as 0 | 1 | 2 | 3 | 4, isDark) }}
                    />
                  ))}
                  <span className="text-xs text-muted-foreground">More</span>
                </div>
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

interface GitHubYearViewProps {
  year: number
  selectedRepos: string[]
  onReposChange: (repos: string[]) => void
}

export function GitHubYearView({ year, selectedRepos, onReposChange }: GitHubYearViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  const [selectedSession, setSelectedSession] = useState<RepoWorkSession | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const githubData = useMemo(() => generateGitHubYearData(year), [year])
  const repoSessions = useMemo(() => generateRepoSessions(githubData.contributions), [githubData])

  const allRepos = useMemo(() => {
    const repoSet = new Set<string>()
    repoSessions.forEach((session) => repoSet.add(session.repo))
    return Array.from(repoSet).map((name) => ({
      name,
      color: getRepoColor(name).borderColor,
    }))
  }, [repoSessions])

  // Update selected repos when allRepos changes
  useMemo(() => {
    const repoNames = allRepos.map((r) => r.name)
    onReposChange((prev) => {
      // Keep only repos that still exist, add new ones
      const filtered = prev.filter((r) => repoNames.includes(r))
      const newRepos = repoNames.filter((r) => !prev.includes(r))
      return [...filtered, ...newRepos]
    })
  }, [allRepos])

  // Filter sessions by selected repos
  const filteredSessions = useMemo(() => {
    return repoSessions.filter((session) => selectedRepos.includes(session.repo))
  }, [repoSessions, selectedRepos])

  const gridData = useMemo(() => {
    const grid: ({
      date: Date
      dayOfMonth: number
      month: number
      dayOfWeek: number
      dayIndex: number
      contribution: DayContribution | null
    } | null)[][] = []
    const startDate = new Date(year, 0, 1)
    const endDate = new Date(year, 11, 31)
    const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1

    let dayIndex = 0
    for (let row = 0; row < ROWS; row++) {
      const rowData: (typeof grid)[0] = []
      for (let col = 0; col < COLS; col++) {
        if (dayIndex < totalDays) {
          const date = new Date(year, 0, dayIndex + 1, 12, 0, 0, 0)
          const dateStr = date.toISOString().split("T")[0]
          rowData.push({
            date,
            dayOfMonth: date.getDate(),
            month: date.getMonth(),
            dayOfWeek: date.getDay(),
            dayIndex,
            contribution: githubData.contributions.get(dateStr) || null,
          })
          dayIndex++
        } else {
          rowData.push(null)
        }
      }
      grid.push(rowData)
    }
    return grid
  }, [year, githubData])

  const sessionPositions = useMemo(() => {
    const positions: {
      session: RepoWorkSession
      row: number
      startCol: number
      endCol: number
      isStart: boolean
      isEnd: boolean
      slotIndex: number
    }[] = []

    const rowSlots: Map<number, Set<number>[]> = new Map()

    filteredSessions.forEach((session) => {
      const sessionStart = new Date(session.startDate + "T00:00:00")
      const sessionEnd = new Date(session.endDate + "T23:59:59")

      gridData.forEach((row, rowIndex) => {
        let startCol = -1
        let endCol = -1

        row.forEach((day, colIndex) => {
          if (!day) return
          const dayDate = new Date(day.date)
          dayDate.setHours(12, 0, 0, 0)

          if (dayDate >= sessionStart && dayDate <= sessionEnd) {
            if (startCol === -1) startCol = colIndex
            endCol = colIndex
          }
        })

        if (startCol !== -1) {
          if (!rowSlots.has(rowIndex)) {
            rowSlots.set(rowIndex, [])
          }
          const slots = rowSlots.get(rowIndex)!

          let slotIndex = 0
          while (true) {
            if (!slots[slotIndex]) {
              slots[slotIndex] = new Set()
            }
            let conflict = false
            for (let c = startCol; c <= endCol; c++) {
              if (slots[slotIndex].has(c)) {
                conflict = true
                break
              }
            }
            if (!conflict) break
            slotIndex++
            if (slotIndex >= MAX_SWIMLANES_PER_ROW) break
          }

          if (slotIndex < MAX_SWIMLANES_PER_ROW) {
            for (let c = startCol; c <= endCol; c++) {
              slots[slotIndex].add(c)
            }

            const firstDayInRow = row[startCol]?.date
            const lastDayInRow = row[endCol]?.date

            positions.push({
              session,
              row: rowIndex,
              startCol,
              endCol,
              isStart: firstDayInRow ? firstDayInRow.toISOString().split("T")[0] === session.startDate : false,
              isEnd: lastDayInRow ? lastDayInRow.toISOString().split("T")[0] === session.endDate : false,
              slotIndex,
            })
          }
        }
      })
    })

    return positions
  }, [filteredSessions, gridData])

  const sessionsByRow = useMemo(() => {
    const byRow: Map<number, typeof sessionPositions> = new Map()
    sessionPositions.forEach((pos) => {
      if (!byRow.has(pos.row)) {
        byRow.set(pos.row, [])
      }
      byRow.get(pos.row)!.push(pos)
    })
    return byRow
  }, [sessionPositions])

  const handleSessionClick = (session: RepoWorkSession) => {
    setSelectedSession(session)
    setSheetOpen(true)
  }

  return (
    <TooltipPrimitive.Provider delayDuration={800} skipDelayDuration={300}>
      <div className="h-full flex flex-col">
        {/* Calendar Grid */}
        <div ref={scrollRef} className="flex-1 overflow-auto">
          <div ref={gridRef} className="min-w-[1000px]">
            {gridData.map((row, rowIndex) => {
              const rowSessions = sessionsByRow.get(rowIndex) || []

              return (
                <div key={rowIndex} className="relative">
                  <div
                    className="grid border-b border-border/30"
                    style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
                  >
                    {row.map((day, colIndex) => {
                      if (!day) {
                        return <div key={colIndex} className="aspect-square bg-muted/20" data-cell />
                      }

                      const dateStr = day.date.toISOString().split("T")[0]
                      const contribution = day.contribution
                      const today = isToday(day.date)
                      const past = isPastDay(day.date) && !today
                      const isWeekend = day.dayOfWeek === 0 || day.dayOfWeek === 6
                      const isMonthStart = day.dayOfMonth === 1

                      return (
                        <div
                          key={day.date.toISOString()}
                          data-cell
                          className={cn(
                            "aspect-square border-r border-border/20 relative cursor-pointer transition-colors bg-background",
                            isWeekend && "weekend-day",
                            past && !today && "past-day-stripes",
                            today && "today-highlight",
                            isMonthStart && "border-l-[3px] border-l-zinc-400 dark:border-l-zinc-500",
                            "hover:bg-muted/30",
                          )}
                        >
                          {/* Month label */}
                          {isMonthStart && (
                            <span className="absolute top-0.5 left-0.5 bg-zinc-700 dark:bg-zinc-600 text-white text-[7px] font-bold px-1 py-px rounded tracking-wide leading-none z-10">
                              {MONTHS[day.month]}
                            </span>
                          )}

                          {/* Day header */}
                          <div className="absolute top-0.5 right-0.5 flex items-center gap-0.5">
                            <span
                              className={cn(
                                "text-[7px] font-medium uppercase leading-none",
                                today ? "today-text-light-muted" : "text-muted-foreground/60",
                              )}
                            >
                              {DAYS[day.dayOfWeek]}
                            </span>
                            <span
                              className={cn(
                                "text-[10px] font-bold leading-none",
                                today ? "today-text-light" : "text-foreground",
                              )}
                            >
                              {day.dayOfMonth}
                            </span>
                          </div>

                          {/* Small heat indicator in top-left */}
                          {contribution && contribution.commits > 0 && (
                            <div
                              className={cn(
                                "absolute w-1.5 h-1.5 rounded-sm",
                                isMonthStart ? "top-3.5 left-0.5" : "top-0.5 left-0.5",
                              )}
                              style={{ backgroundColor: getContributionBg(contribution.level, isDark) }}
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Swimlanes overlay */}
                  <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
                    {rowSessions.map((pos, idx) => {
                      const { session, startCol, endCol, isStart, isEnd, slotIndex } = pos
                      const colors = getRepoColor(session.repo)

                      const leftPercent = (startCol / COLS) * 100
                      const widthPercent = ((endCol - startCol + 1) / COLS) * 100

                      const slotHeight = 14
                      const slotGap = 2
                      const baseTop = 24
                      const top = baseTop + slotIndex * (slotHeight + slotGap)

                      return (
                        <div
                          key={`${session.repo}-${session.startDate}-${idx}`}
                          className={cn(
                            "absolute pointer-events-auto cursor-pointer transition-all hover:opacity-90",
                            isStart && "rounded-l",
                            isEnd && "rounded-r",
                          )}
                          style={{
                            left: `${leftPercent}%`,
                            width: `${widthPercent}%`,
                            top: `${top}px`,
                            height: `${slotHeight}px`,
                            borderLeft: `3px solid ${colors.borderColor}`,
                            backgroundColor: colors.lightFill,
                          }}
                          onClick={() => handleSessionClick(session)}
                        >
                          {isStart && (
                            <span
                              className="text-[10px] font-medium truncate px-1.5 leading-[14px] block"
                              style={{
                                color: isDark ? colors.textLight : colors.textDark,
                              }}
                            >
                              {session.repo}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <SessionDetailSheet session={selectedSession} open={sheetOpen} onClose={() => setSheetOpen(false)} />
      </div>
    </TooltipPrimitive.Provider>
  )
}

export function getGitHubRepos(year: number) {
  const githubData = generateGitHubYearData(year)
  const repoSessions = generateRepoSessions(githubData.contributions)
  const repoSet = new Set<string>()
  repoSessions.forEach((session) => repoSet.add(session.repo))
  return Array.from(repoSet).map((name) => ({
    name,
    color: getRepoColor(name).borderColor,
  }))
}
