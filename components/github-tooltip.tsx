"use client"

import type React from "react"

import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { GitCommit, GitPullRequest, GitMerge, Code2 } from "lucide-react"
import type { DayContribution, RepoWorkSession } from "@/lib/github-data"

interface GitHubDayTooltipProps {
  date: Date
  contribution: DayContribution | null
  children: React.ReactNode
}

export function GitHubDayTooltip({ date, contribution, children }: GitHubDayTooltipProps) {
  const hasActivity = contribution && contribution.commits > 0

  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side="top"
          align="center"
          sideOffset={8}
          className="z-[9999] max-w-[280px] p-3 bg-white dark:bg-zinc-900 text-foreground border border-gray-200 dark:border-zinc-700 shadow-xl rounded-lg animate-in fade-in-0 zoom-in-95 duration-150"
        >
          <p className="font-semibold text-sm mb-1 text-gray-900 dark:text-gray-100">
            {date.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
          {hasActivity ? (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300">
                <GitCommit className="h-3.5 w-3.5 text-emerald-500" />
                <span>{contribution.commits} commits</span>
              </div>

              {(contribution.prsOpened > 0 || contribution.prsMerged > 0) && (
                <div className="flex items-center gap-3 text-xs">
                  {contribution.prsOpened > 0 && (
                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <GitPullRequest className="h-3 w-3" />
                      <span>{contribution.prsOpened} PR opened</span>
                    </div>
                  )}
                  {contribution.prsMerged > 0 && (
                    <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                      <GitMerge className="h-3 w-3" />
                      <span>{contribution.prsMerged} merged</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-3 text-xs pt-1.5 border-t border-gray-100 dark:border-zinc-700">
                <span className="text-green-600 dark:text-green-400 font-mono">
                  +{contribution.linesAdded.toLocaleString()} lines
                </span>
                <span className="text-red-500 dark:text-red-400 font-mono">
                  -{contribution.linesDeleted.toLocaleString()} lines
                </span>
              </div>

              {contribution.repos.length > 0 && (
                <div className="text-xs text-gray-500 dark:text-gray-400 pt-1.5 border-t border-gray-100 dark:border-zinc-700">
                  <span className="flex items-center gap-1">
                    <Code2 className="h-3 w-3" />
                    {contribution.repos.slice(0, 3).join(", ")}
                    {contribution.repos.length > 3 && ` +${contribution.repos.length - 3} more`}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400">No contributions</p>
          )}
          <TooltipPrimitive.Arrow className="fill-white dark:fill-zinc-900" width={12} height={6} />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}

interface GitHubSessionTooltipProps {
  session: RepoWorkSession
  children: React.ReactNode
}

export function GitHubSessionTooltip({ session, children }: GitHubSessionTooltipProps) {
  const startDate = new Date(session.startDate + "T12:00:00")
  const endDate = new Date(session.endDate + "T12:00:00")
  const days = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

  // Find peak day
  let peakCommits = 0
  let peakDate = session.startDate
  session.dailyCommits.forEach((commits, date) => {
    if (commits > peakCommits) {
      peakCommits = commits
      peakDate = date
    }
  })

  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side="top"
          align="center"
          sideOffset={8}
          className="z-[9999] max-w-[300px] p-3 bg-white dark:bg-zinc-900 text-foreground border border-gray-200 dark:border-zinc-700 shadow-xl rounded-lg animate-in fade-in-0 zoom-in-95 duration-150"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: session.color }} />
            <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{session.repo}</p>
          </div>

          <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-300">
            <p>
              {startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} -{" "}
              {endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
            <p className="font-medium">
              {session.totalCommits} commits over {days} days
            </p>
            <p className="text-gray-500 dark:text-gray-400">
              Peak: {peakCommits} commits on{" "}
              {new Date(peakDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </p>
          </div>

          <TooltipPrimitive.Arrow className="fill-white dark:fill-zinc-900" width={12} height={6} />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}
