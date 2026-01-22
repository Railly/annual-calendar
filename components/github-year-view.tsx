"use client"

import type React from "react"

import { useMemo, useRef, useState, useEffect } from "react"
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
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Calendar,
} from "lucide-react"
import { useTheme } from "next-themes"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import {
  getContributionBg,
  type DayContribution,
  type RepoWorkSession,
  type GitHubYearStats,
  generateGitHubYearData,
  generateRepoSessions,
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

interface StatsDialogProps {
  year: number
  githubData: GitHubYearStats
  isUsingMockData?: boolean
  lastSynced?: string
  onSync?: () => Promise<boolean>
  isSyncing?: boolean
}

export function StatsDialog({ year, githubData, isUsingMockData, lastSynced, onSync, isSyncing }: StatsDialogProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

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
          <DialogPrimitive.Description className="sr-only">GitHub year statistics and sync options</DialogPrimitive.Description>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">Year in Code</h2>
              <DialogPrimitive.Close asChild>
                <button className="p-2 rounded-md hover:bg-muted transition-colors">
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </DialogPrimitive.Close>
            </div>
            
            {/* Sync status */}
            {isUsingMockData && (
              <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Using sample data. Connect GitHub to see real contributions.
                </p>
                {onSync && (
                  <button 
                    onClick={onSync}
                    disabled={isSyncing}
                    className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-300 hover:underline disabled:opacity-50"
                  >
                    {isSyncing ? "Syncing..." : "Sync now"}
                  </button>
                )}
              </div>
            )}
            {!isUsingMockData && lastSynced && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  Last synced: {new Date(lastSynced).toLocaleDateString()}
                </p>
                {onSync && (
                  <button 
                    onClick={onSync}
                    disabled={isSyncing}
                    className="text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:underline disabled:opacity-50"
                  >
                    {isSyncing ? "Syncing..." : "Refresh"}
                  </button>
                )}
              </div>
            )}

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

// Helper to get activity level label
function getActivityLabel(level: 0 | 1 | 2 | 3 | 4): string {
  const labels = ["No activity", "Light activity", "Moderate activity", "High activity", "Intense activity"]
  return labels[level]
}

// Helper to get contribution level based on commits
function getContributionLevel(commits: number): 0 | 1 | 2 | 3 | 4 {
  if (commits === 0) return 0
  if (commits <= 3) return 1
  if (commits <= 6) return 2
  if (commits <= 10) return 3
  return 4
}

// Helper to get heat square size based on level
function getHeatSquareSize(level: 0 | 1 | 2 | 3 | 4): string {
  const sizes = ["w-0 h-0", "w-3 h-3", "w-4 h-4", "w-5 h-5", "w-6 h-6"]
  return sizes[level]
}

// Day Detail Sheet Component
function DayDetailSheet({
  day,
  contribution,
  githubData,
  open,
  onClose,
  onPrev,
  onNext,
  year,
}: {
  day: { date: Date; dayIndex: number } | null
  contribution: DayContribution | null
  githubData: GitHubYearStats
  open: boolean
  onClose: () => void
  onPrev: () => void
  onNext: () => void
  year: number
}) {
  if (!day) return null

  const dayOfYear = day.dayIndex + 1
  const weekOfYear = Math.ceil(dayOfYear / 7)
  const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6
  const level = contribution ? getContributionLevel(contribution.commits) : 0
  
  // Calculate stats
  const activeDays = Array.from(githubData.contributions.values()).filter(c => c.commits > 0).length
  const avgDailyCommits = activeDays > 0 ? githubData.totalCommits / activeDays : 0
  const totalYearLines = githubData.totalLinesAdded + githubData.totalLinesDeleted
  
  // Check if day is in current streak (simple check: is it recent and has contributions)
  const today = new Date()
  const dayDate = new Date(day.date)
  const daysAgo = Math.floor((today.getTime() - dayDate.getTime()) / (1000 * 60 * 60 * 24))
  const isInCurrentStreak = contribution && contribution.commits > 0 && daysAgo <= githubData.currentStreak

  const formattedDate = day.date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const dateStr = day.date.toISOString().split("T")[0]
  const githubUrl = `https://github.com?tab=overview&from=${dateStr}&to=${dateStr}`

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 bg-black/40 z-50 animate-in fade-in-0 duration-200" />
        <DialogPrimitive.Content className="fixed right-0 top-0 h-full w-full max-w-md bg-background border-l border-border shadow-2xl z-50 animate-in slide-in-from-right duration-300 overflow-y-auto">
          <DialogPrimitive.Description className="sr-only">Day contribution details</DialogPrimitive.Description>
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">{formattedDate}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-muted-foreground">{getActivityLabel(level)}</span>
                  {isWeekend && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground">Weekend</span>
                  )}
                </div>
              </div>
              <DialogPrimitive.Close asChild>
                <button className="p-2 rounded-md hover:bg-muted transition-colors">
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </DialogPrimitive.Close>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mb-4 py-2 border-y border-border">
              <button onClick={onPrev} className="p-1.5 rounded hover:bg-muted transition-colors">
                <ChevronLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              <span className="text-xs text-muted-foreground">
                Day {dayOfYear} · Week {weekOfYear}
              </span>
              <button onClick={onNext} className="p-1.5 rounded hover:bg-muted transition-colors">
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* Streak banner */}
            {isInCurrentStreak && (
              <div className="mb-4 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                  Part of your {githubData.currentStreak}-day streak!
                </span>
              </div>
            )}

            {contribution && contribution.commits > 0 ? (
              <>
                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 mb-1">
                      <GitCommit className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-xs text-muted-foreground">Commits</span>
                    </div>
                    <p className="text-xl font-bold text-foreground">{contribution.commits}</p>
                    {avgDailyCommits > 0 && (
                      <p className="text-[10px] text-muted-foreground">
                        {contribution.commits > avgDailyCommits ? "+" : ""}
                        {Math.round(((contribution.commits - avgDailyCommits) / avgDailyCommits) * 100)}% vs avg
                      </p>
                    )}
                  </div>
                  
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 mb-1">
                      <Code2 className="h-3.5 w-3.5 text-blue-500" />
                      <span className="text-xs text-muted-foreground">Net Lines</span>
                    </div>
                    <p className={cn(
                      "text-xl font-bold",
                      contribution.linesAdded - contribution.linesDeleted >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {contribution.linesAdded - contribution.linesDeleted >= 0 ? "+" : ""}
                      {contribution.linesAdded - contribution.linesDeleted}
                    </p>
                    {totalYearLines > 0 && (
                      <p className="text-[10px] text-muted-foreground">
                        {((contribution.linesAdded + contribution.linesDeleted) / totalYearLines * 100).toFixed(1)}% of year
                      </p>
                    )}
                  </div>

                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 mb-1">
                      <Plus className="h-3.5 w-3.5 text-green-500" />
                      <span className="text-xs text-muted-foreground">Added</span>
                    </div>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                      +{formatNumber(contribution.linesAdded)}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 mb-1">
                      <Minus className="h-3.5 w-3.5 text-red-500" />
                      <span className="text-xs text-muted-foreground">Deleted</span>
                    </div>
                    <p className="text-lg font-bold text-red-600 dark:text-red-400">
                      -{formatNumber(contribution.linesDeleted)}
                    </p>
                  </div>

                  {(contribution.prsOpened > 0 || contribution.prsMerged > 0) && (
                    <>
                      {contribution.prsOpened > 0 && (
                        <div className="p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2 mb-1">
                            <GitPullRequest className="h-3.5 w-3.5 text-green-500" />
                            <span className="text-xs text-muted-foreground">PRs Opened</span>
                          </div>
                          <p className="text-lg font-bold text-foreground">{contribution.prsOpened}</p>
                        </div>
                      )}
                      {contribution.prsMerged > 0 && (
                        <div className="p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2 mb-1">
                            <GitMerge className="h-3.5 w-3.5 text-purple-500" />
                            <span className="text-xs text-muted-foreground">PRs Merged</span>
                          </div>
                          <p className="text-lg font-bold text-foreground">{contribution.prsMerged}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Repos worked on */}
                {contribution.repos.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-foreground mb-2">Repos worked on</h3>
                    <div className="flex flex-wrap gap-2">
                      {contribution.repos.map((repo) => {
                        const colors = getRepoColor(repo)
                        return (
                          <span
                            key={repo}
                            className="text-xs px-2 py-1 rounded"
                            style={{
                              backgroundColor: colors.lightFill,
                              borderLeft: `3px solid ${colors.borderColor}`,
                            }}
                          >
                            {repo}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="py-12 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">No contributions on this day</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Rest days are important too!</p>
              </div>
            )}

            {/* View on GitHub button */}
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium text-sm hover:opacity-90 transition-opacity"
            >
              <ExternalLink className="h-4 w-4" />
              View on GitHub
            </a>
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
  githubData: GitHubYearStats
  repoSessions: RepoWorkSession[]
  isUsingMockData?: boolean
  lastSynced?: string
  onSync?: () => Promise<boolean>
  isSyncing?: boolean
}

export function GitHubYearView({ 
  year, 
  selectedRepos, 
  onReposChange,
  githubData,
  repoSessions,
  isUsingMockData,
  lastSynced,
  onSync,
  isSyncing,
}: GitHubYearViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  const [selectedSession, setSelectedSession] = useState<RepoWorkSession | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  
  // Day detail sheet state
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null)
  const [daySheetOpen, setDaySheetOpen] = useState(false)

  const allRepos = useMemo(() => {
    const repoSet = new Set<string>()
    repoSessions.forEach((session) => repoSet.add(session.repo))
    return Array.from(repoSet).map((name) => ({
      name,
      color: getRepoColor(name).borderColor,
    }))
  }, [repoSessions])

  useEffect(() => {
    const repoNames = allRepos.map((r) => r.name)
    // Only update if repos actually changed
    const hasNewRepos = repoNames.some((r) => !selectedRepos.includes(r))
    const hasRemovedRepos = selectedRepos.some((r) => !repoNames.includes(r))

    if (hasNewRepos || hasRemovedRepos) {
      const filtered = selectedRepos.filter((r) => repoNames.includes(r))
      const newRepos = repoNames.filter((r) => !selectedRepos.includes(r))
      onReposChange([...filtered, ...newRepos])
    }
  }, [allRepos, selectedRepos, onReposChange])

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

  const handleDayClick = (dayIndex: number) => {
    setSelectedDayIndex(dayIndex)
    setDaySheetOpen(true)
  }

  const handlePrevDay = () => {
    if (selectedDayIndex !== null && selectedDayIndex > 0) {
      setSelectedDayIndex(selectedDayIndex - 1)
    }
  }

  const handleNextDay = () => {
    const totalDays = gridData.flat().filter(Boolean).length
    if (selectedDayIndex !== null && selectedDayIndex < totalDays - 1) {
      setSelectedDayIndex(selectedDayIndex + 1)
    }
  }

  // Get selected day data for the sheet
  const selectedDayData = useMemo(() => {
    if (selectedDayIndex === null) return null
    const flatDays = gridData.flat().filter(Boolean)
    const day = flatDays[selectedDayIndex]
    if (!day) return null
    return {
      date: day.date,
      dayIndex: selectedDayIndex,
      contribution: day.contribution,
    }
  }, [selectedDayIndex, gridData])

  return (
    <TooltipPrimitive.Provider delayDuration={800} skipDelayDuration={300}>
      <div className="h-full flex flex-col">
        {/* Data Status Banner */}
        {isUsingMockData && (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border-b border-amber-500/20">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <span className="text-xs text-amber-600 dark:text-amber-400 flex-1">
              Showing demo data. Sign in with GitHub to see your real contributions.
            </span>
            {onSync && (
              <button
                onClick={onSync}
                disabled={isSyncing}
                className="text-xs font-medium px-2 py-1 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 hover:bg-amber-500/30 disabled:opacity-50 transition-colors flex items-center gap-1"
              >
                {isSyncing && <RefreshCw className="h-3 w-3 animate-spin" />}
                {isSyncing ? "Syncing..." : "Connect GitHub"}
              </button>
            )}
          </div>
        )}
        {!isUsingMockData && lastSynced && (
          <div className="flex items-center justify-between px-4 py-2 bg-emerald-500/10 border-b border-emerald-500/20">
            <span className="text-xs text-emerald-600 dark:text-emerald-400">
              Last synced: {new Date(lastSynced).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </span>
            {onSync && (
              <button
                onClick={onSync}
                disabled={isSyncing}
                className="text-xs font-medium px-2 py-1 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-50 transition-colors flex items-center gap-1"
              >
                {isSyncing && <RefreshCw className="h-3 w-3 animate-spin" />}
                {isSyncing ? "Syncing..." : "Refresh"}
              </button>
            )}
          </div>
        )}

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
                        <GitHubDayTooltip key={day.date.toISOString()} date={day.date} contribution={contribution}>
                          <div 
                            data-cell
                            className={cn(
                              "aspect-square border-r border-border/20 relative cursor-pointer transition-colors bg-background",
                              isWeekend && "weekend-day",
                              past && !today && "past-day-stripes",
                              today && "today-highlight",
                              isMonthStart && "border-l-[3px] border-l-zinc-400 dark:border-l-zinc-500",
                              "hover:bg-muted/30",
                            )} 
                            onClick={() => handleDayClick(day.dayIndex)}
                          >
                            {/* Month label */}
                            {isMonthStart && (
                              <span className="absolute top-0 left-0 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[7px] font-bold px-1 py-px tracking-wide leading-none z-10">
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

                            {/* Centered scaled heat square */}
                            {contribution && contribution.commits > 0 && (
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="flex flex-col items-center">
                                  <div
                                    className={cn(
                                      "rounded-sm",
                                      getHeatSquareSize(contribution.level),
                                      contribution.commits >= 5 && "mt-1",
                                    )}
                                    style={{ backgroundColor: getContributionBg(contribution.level, isDark) }}
                                  />
                                  {contribution.commits >= 5 && (
                                    <span className="text-[8px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                      {contribution.commits}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </GitHubDayTooltip>
                      )
                    })}
                  </div>

                  {/* Swimlanes overlay - only show when using real data */}
                  {!isUsingMockData && (
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
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {sheetOpen && (
          <SessionDetailSheet session={selectedSession} open={sheetOpen} onClose={() => setSheetOpen(false)} />
        )}
        {daySheetOpen && (
          <DayDetailSheet 
            day={selectedDayData} 
            contribution={selectedDayData ? selectedDayData.contribution : null} 
            githubData={githubData} 
            open={daySheetOpen} 
            onClose={() => setDaySheetOpen(false)} 
            onPrev={handlePrevDay} 
            onNext={handleNextDay} 
            year={year} 
          />
        )}
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
