"use client"

import type React from "react"

import { useMemo, useRef, useState } from "react"
import { GitCommit, GitPullRequest, GitMerge, Plus, Minus, Flame, Trophy, Code2, X, FileCode } from "lucide-react"
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

const REPO_COLORS: Record<string, { bg: string; textLight: string; textDark: string }> = {
  "annual-calendar-2026": { bg: "#3b82f6", textLight: "#1e3a5f", textDark: "#1e3a5f" }, // blue - dark blue text
  "sanity-cms-integration": { bg: "#f97316", textLight: "#7c2d12", textDark: "#7c2d12" }, // orange - dark orange text
  "ai-event-parser": { bg: "#a855f7", textLight: "#4c1d95", textDark: "#4c1d95" }, // purple - dark purple text
  "nextjs-starter": { bg: "#10b981", textLight: "#064e3b", textDark: "#064e3b" }, // emerald - dark green text
  "design-system": { bg: "#ec4899", textLight: "#831843", textDark: "#831843" }, // pink - dark pink text
  "api-gateway": { bg: "#14b8a6", textLight: "#134e4a", textDark: "#134e4a" }, // teal - dark teal text
  "mobile-app": { bg: "#ef4444", textLight: "#7f1d1d", textDark: "#7f1d1d" }, // red - dark red text
  "docs-site": { bg: "#f59e0b", textLight: "#78350f", textDark: "#78350f" }, // amber/yellow - dark amber text
}

function getRepoColor(repo: string) {
  return REPO_COLORS[repo] || { bg: "#6b7280", textLight: "#1f2937", textDark: "#1f2937" }
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

function getSessionGradient(
  session: RepoWorkSession,
  startCol: number,
  endCol: number,
  row: ({
    date: Date
    dayOfMonth: number
    month: number
    dayOfWeek: number
    dayIndex: number
    contribution: DayContribution | null
  } | null)[],
) {
  const repoColor = getRepoColor(session.repo)
  const bgColor = repoColor.bg

  // Parse hex to rgb
  const r = Number.parseInt(bgColor.slice(1, 3), 16)
  const g = Number.parseInt(bgColor.slice(3, 5), 16)
  const b = Number.parseInt(bgColor.slice(5, 7), 16)

  const stops: string[] = []
  let maxCommits = 1
  session.dailyCommits.forEach((c) => {
    if (c > maxCommits) maxCommits = c
  })

  const totalCols = endCol - startCol + 1

  for (let i = 0; i <= totalCols; i++) {
    const col = startCol + i
    const day = row[col]
    if (!day) continue

    const dateStr = day.date.toISOString().split("T")[0]
    const commits = session.dailyCommits.get(dateStr) || 0
    const intensity = commits / maxCommits
    // Low commits = low opacity (transparent/fading), high commits = high opacity (solid)
    const opacity = 0.25 + intensity * 0.75
    const percent = (i / totalCols) * 100

    // Use the actual bar color with varying opacity
    stops.push(`rgba(${r},${g},${b},${opacity}) ${percent}%`)
  }

  return stops.length > 1 ? `linear-gradient(to right, ${stops.join(", ")})` : "none"
}

interface GitHubYearViewProps {
  year: number
}

export function GitHubYearView({ year }: GitHubYearViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  const [selectedSession, setSelectedSession] = useState<RepoWorkSession | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const githubData = useMemo(() => generateGitHubYearData(year), [year])
  const repoSessions = useMemo(() => generateRepoSessions(githubData.contributions), [githubData])

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

    repoSessions.forEach((session) => {
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
          }

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
      })
    })

    return positions
  }, [repoSessions, gridData])

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
        {/* Stats Header */}
        <div className="flex-shrink-0 border-b border-border bg-background/80 backdrop-blur-sm px-4 py-3">
          <div className="flex items-center justify-between gap-6 max-w-full overflow-x-auto">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-emerald-500/10">
                  <GitCommit className="h-4 w-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Commits</p>
                  <p className="text-lg font-bold text-foreground">{formatNumber(githubData.totalCommits)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-purple-500/10">
                  <GitMerge className="h-4 w-4 text-purple-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">PRs Merged</p>
                  <p className="text-lg font-bold text-foreground">{githubData.totalPRsMerged}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-green-500/10">
                  <Plus className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Lines Added</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    {formatNumber(githubData.totalLinesAdded)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-red-500/10">
                  <Minus className="h-4 w-4 text-red-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Lines Deleted</p>
                  <p className="text-lg font-bold text-red-600 dark:text-red-400">
                    {formatNumber(githubData.totalLinesDeleted)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-orange-500/10">
                  <Flame className="h-4 w-4 text-orange-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Current Streak</p>
                  <p className="text-lg font-bold text-foreground">{githubData.currentStreak} days</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-yellow-500/10">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Longest Streak</p>
                  <p className="text-lg font-bold text-foreground">{githubData.longestStreak} days</p>
                </div>
              </div>

              {/* Contribution legend */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>Less</span>
                {[0, 1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: getContributionBg(level as 0 | 1 | 2 | 3 | 4, isDark) }}
                  />
                ))}
                <span>More</span>
              </div>
            </div>
          </div>
        </div>

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
                        return (
                          <div
                            key={`empty-${rowIndex}-${colIndex}`}
                            className="aspect-square bg-background border-r border-border/20"
                          />
                        )
                      }

                      const isMonthStart = day.dayOfMonth === 1
                      const isTodayDate = isToday(day.date)
                      const isPast = isPastDay(day.date) && !isTodayDate
                      const isWeekend = day.dayOfWeek === 0 || day.dayOfWeek === 6
                      const contrib = day.contribution
                      const hasActivity = contrib && contrib.commits > 0

                      return (
                        <GitHubDayTooltip key={day.date.toISOString()} date={day.date} contribution={contrib}>
                          <div
                            data-cell
                            className={cn(
                              "aspect-square border-r border-border/20 cursor-default transition-all relative overflow-hidden",
                              isTodayDate && "today-highlight",
                              isPast && "past-day-stripes",
                              isWeekend && !isTodayDate && "weekend-day",
                              !isWeekend && !isTodayDate && !isPast && "bg-background",
                              isMonthStart && "border-l-[3px] border-l-zinc-400 dark:border-l-zinc-500",
                            )}
                          >
                            {hasActivity && (
                              <div
                                className="absolute top-0.5 left-0.5 w-1.5 h-1.5 rounded-[2px]"
                                style={{
                                  backgroundColor: getContributionBg(contrib.level, isDark),
                                }}
                              />
                            )}

                            {/* Month label */}
                            {isMonthStart && (
                              <span className="absolute top-0.5 left-2.5 bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-800 text-[7px] font-bold px-1 py-px rounded tracking-wide leading-none z-10">
                                {MONTHS[day.month]}
                              </span>
                            )}

                            {/* Day info */}
                            <div className="absolute top-0.5 right-0.5 flex items-center gap-0.5">
                              <span
                                className={cn(
                                  "text-[7px] font-medium uppercase leading-none",
                                  isTodayDate
                                    ? "today-text-light-muted"
                                    : isWeekend
                                      ? "text-muted-foreground/80"
                                      : "text-muted-foreground/60",
                                )}
                              >
                                {DAYS[day.dayOfWeek]}
                              </span>
                              <span
                                className={cn(
                                  "text-[10px] font-bold leading-none",
                                  isTodayDate
                                    ? "today-text-light"
                                    : isWeekend
                                      ? "text-foreground/80"
                                      : "text-foreground",
                                )}
                              >
                                {day.dayOfMonth}
                              </span>
                            </div>
                          </div>
                        </GitHubDayTooltip>
                      )
                    })}
                  </div>

                  {/* Session swimlanes */}
                  <div className="absolute inset-0 pointer-events-none">
                    {rowSessions.map((pos, i) => {
                      const colWidth = 100 / COLS
                      const left = pos.startCol * colWidth
                      const width = (pos.endCol - pos.startCol + 1) * colWidth
                      const top = 24 + pos.slotIndex * 18

                      const repoColor = getRepoColor(pos.session.repo)
                      const gradientMask = getSessionGradient(pos.session, pos.startCol, pos.endCol, row)

                      return (
                        <TooltipPrimitive.Root key={`${pos.session.repo}-${pos.row}-${i}`}>
                          <TooltipPrimitive.Trigger asChild>
                            <div
                              className={cn(
                                "absolute h-[16px] pointer-events-auto cursor-pointer transition-all hover:brightness-110 flex items-center",
                                pos.isStart && "rounded-l pl-1",
                                pos.isEnd && "rounded-r pr-0.5",
                              )}
                              style={{
                                left: `${left}%`,
                                width: `${width}%`,
                                top: `${top}px`,
                                backgroundColor: repoColor.bg,
                              }}
                              onClick={() => handleSessionClick(pos.session)}
                            >
                              <div
                                className="absolute inset-0"
                                style={{
                                  background: gradientMask,
                                  borderRadius: "inherit",
                                }}
                              />

                              {pos.isStart && (
                                <span
                                  className="relative z-10 text-[9px] font-medium leading-[16px] truncate max-w-[90%]"
                                  style={{
                                    color: isDark ? repoColor.textDark : repoColor.textLight,
                                  }}
                                >
                                  {pos.session.repo}
                                </span>
                              )}
                            </div>
                          </TooltipPrimitive.Trigger>
                          <TooltipPrimitive.Portal>
                            <TooltipPrimitive.Content
                              side="top"
                              sideOffset={6}
                              className="z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl px-3 py-2 animate-in fade-in-0 zoom-in-95 duration-150"
                            >
                              <TooltipPrimitive.Arrow className="fill-white dark:fill-zinc-900" width={10} height={5} />
                              <p className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                                {pos.session.repo}
                              </p>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                {pos.session.totalCommits} commits · Click for details
                              </p>
                            </TooltipPrimitive.Content>
                          </TooltipPrimitive.Portal>
                        </TooltipPrimitive.Root>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Session detail sheet */}
        <SessionDetailSheet session={selectedSession} open={sheetOpen} onClose={() => setSheetOpen(false)} />
      </div>
    </TooltipPrimitive.Provider>
  )
}
