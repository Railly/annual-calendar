// GitHub contribution data types and enhanced sample data

export interface DayContribution {
  date: string // YYYY-MM-DD
  commits: number
  prsOpened: number
  prsMerged: number
  prsClosed: number
  linesAdded: number
  linesDeleted: number
  level: 0 | 1 | 2 | 3 | 4 // Contribution intensity level
  repos: string[] // Repos contributed to that day
}

export interface GitHubRepo {
  name: string
  commits: number
  additions: number
  deletions: number
  language: string
  color: string
}

export interface GitHubYearStats {
  totalCommits: number
  totalPRsOpened: number
  totalPRsMerged: number
  totalLinesAdded: number
  totalLinesDeleted: number
  longestStreak: number
  currentStreak: number
  topRepos: GitHubRepo[]
  contributions: Map<string, DayContribution>
}

export interface RepoWorkSession {
  repo: string
  startDate: string
  endDate: string
  totalCommits: number
  dailyCommits: Map<string, number> // date -> commits for intensity gradient
  color: string
}

// Generate realistic GitHub contribution data for a year
export function generateGitHubYearData(year: number): GitHubYearStats {
  const contributions = new Map<string, DayContribution>()
  const startDate = new Date(year, 0, 1)
  const endDate = new Date(year, 11, 31)

  let totalCommits = 0
  let totalPRsOpened = 0
  let totalPRsMerged = 0
  let totalLinesAdded = 0
  let totalLinesDeleted = 0
  let longestStreak = 0
  let currentStreak = 0
  let tempStreak = 0

  const repoNames = [
    "annual-calendar-2026",
    "sanity-cms-integration",
    "ai-event-parser",
    "nextjs-starter",
    "design-system",
    "api-gateway",
    "mobile-app",
    "docs-site",
  ]

  // Generate contribution data for each day
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0]
    const dayOfWeek = d.getDay()
    const month = d.getMonth()
    const dayOfMonth = d.getDate()

    // Create realistic patterns
    let baseChance = dayOfWeek === 0 || dayOfWeek === 6 ? 0.35 : 0.75

    // Vacation periods (lower activity)
    if (
      (month === 6 && dayOfMonth >= 15 && dayOfMonth <= 30) ||
      (month === 11 && dayOfMonth >= 20) ||
      (month === 7 && dayOfMonth >= 1 && dayOfMonth <= 10)
    ) {
      baseChance = 0.15
    }

    // Sprint periods (higher activity)
    if (
      (month === 2 && dayOfMonth >= 1 && dayOfMonth <= 15) ||
      (month === 8 && dayOfMonth >= 1 && dayOfMonth <= 20) ||
      month === 10 ||
      (month === 0 && dayOfMonth >= 5 && dayOfMonth <= 15)
    ) {
      baseChance = 0.92
    }

    const hasActivity = Math.random() < baseChance

    let commits = 0
    let prsOpened = 0
    let prsMerged = 0
    let prsClosed = 0
    let linesAdded = 0
    let linesDeleted = 0
    let level: 0 | 1 | 2 | 3 | 4 = 0
    const repos: string[] = []

    if (hasActivity) {
      const rand = Math.random()
      if (rand < 0.35) {
        commits = Math.floor(Math.random() * 4) + 1
        level = 1
      } else if (rand < 0.65) {
        commits = Math.floor(Math.random() * 6) + 4
        level = 2
      } else if (rand < 0.88) {
        commits = Math.floor(Math.random() * 8) + 8
        level = 3
      } else {
        commits = Math.floor(Math.random() * 12) + 15
        level = 4
      }

      // PRs - less frequent than commits
      if (Math.random() < 0.25) {
        prsOpened = Math.floor(Math.random() * 2) + 1
      }
      if (Math.random() < 0.2) {
        prsMerged = Math.floor(Math.random() * 2) + 1
      }
      if (Math.random() < 0.1) {
        prsClosed = 1
      }

      // Lines of code
      linesAdded = commits * Math.floor(Math.random() * 50 + 10)
      linesDeleted = Math.floor(linesAdded * (Math.random() * 0.4 + 0.1))

      // Repos contributed to
      const numRepos = Math.min(Math.floor(Math.random() * 3) + 1, commits)
      const shuffled = [...repoNames].sort(() => 0.5 - Math.random())
      repos.push(...shuffled.slice(0, numRepos))

      totalCommits += commits
      totalPRsOpened += prsOpened
      totalPRsMerged += prsMerged
      totalLinesAdded += linesAdded
      totalLinesDeleted += linesDeleted
      tempStreak++
      if (tempStreak > longestStreak) longestStreak = tempStreak
    } else {
      tempStreak = 0
    }

    contributions.set(dateStr, {
      date: dateStr,
      commits,
      prsOpened,
      prsMerged,
      prsClosed,
      linesAdded,
      linesDeleted,
      level,
      repos,
    })
  }

  // Calculate current streak
  const today = new Date()
  if (today.getFullYear() === year) {
    const entries = Array.from(contributions.entries()).sort((a, b) => b[0].localeCompare(a[0]))
    for (const [, data] of entries) {
      if (data.commits > 0) {
        currentStreak++
      } else {
        break
      }
    }
  }

  // Top repos with stats
  const topRepos: GitHubRepo[] = [
    {
      name: "annual-calendar-2026",
      commits: 234,
      additions: 15420,
      deletions: 3210,
      language: "TypeScript",
      color: "#3178c6",
    },
    {
      name: "design-system",
      commits: 156,
      additions: 12800,
      deletions: 4200,
      language: "TypeScript",
      color: "#3178c6",
    },
    { name: "api-gateway", commits: 98, additions: 6540, deletions: 1890, language: "Go", color: "#00ADD8" },
    {
      name: "sanity-cms-integration",
      commits: 89,
      additions: 4520,
      deletions: 890,
      language: "TypeScript",
      color: "#3178c6",
    },
    { name: "mobile-app", commits: 67, additions: 8900, deletions: 2340, language: "Swift", color: "#F05138" },
  ]

  return {
    totalCommits,
    totalPRsOpened,
    totalPRsMerged,
    totalLinesAdded,
    totalLinesDeleted,
    longestStreak,
    currentStreak,
    topRepos,
    contributions,
  }
}

export function generateRepoSessions(contributions: Map<string, DayContribution>): RepoWorkSession[] {
  const repoColors: Record<string, string> = {
    "annual-calendar-2026": "#3b82f6",
    "sanity-cms-integration": "#f97316",
    "ai-event-parser": "#a855f7",
    "nextjs-starter": "#10b981",
    "design-system": "#ec4899",
    "api-gateway": "#14b8a6",
    "mobile-app": "#ef4444",
    "docs-site": "#eab308",
  }

  // Group consecutive days by repo
  const repoWork: Map<string, { dates: string[]; commits: Map<string, number> }> = new Map()

  const sortedDates = Array.from(contributions.keys()).sort()

  sortedDates.forEach((dateStr) => {
    const contrib = contributions.get(dateStr)!
    contrib.repos.forEach((repo) => {
      if (!repoWork.has(repo)) {
        repoWork.set(repo, { dates: [], commits: new Map() })
      }
      const rw = repoWork.get(repo)!
      rw.dates.push(dateStr)
      rw.commits.set(dateStr, contrib.commits)
    })
  })

  // Convert to sessions - group consecutive days or days within 3-day gaps
  const sessions: RepoWorkSession[] = []

  repoWork.forEach((data, repo) => {
    if (data.dates.length === 0) return

    const sortedDates = data.dates.sort()
    let sessionStart = sortedDates[0]
    let sessionEnd = sortedDates[0]
    let sessionCommits = new Map<string, number>()
    let totalCommits = 0

    const addCommit = (date: string) => {
      const commits = data.commits.get(date) || 0
      sessionCommits.set(date, commits)
      totalCommits += commits
    }

    addCommit(sessionStart)

    for (let i = 1; i < sortedDates.length; i++) {
      const currentDate = new Date(sortedDates[i])
      const prevDate = new Date(sortedDates[i - 1])
      const daysDiff = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))

      if (daysDiff <= 3) {
        // Continue session
        sessionEnd = sortedDates[i]
        addCommit(sortedDates[i])
      } else {
        // Save current session if it's at least 2 days
        const startD = new Date(sessionStart)
        const endD = new Date(sessionEnd)
        const duration = Math.floor((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24)) + 1

        if (duration >= 2 && totalCommits >= 3) {
          sessions.push({
            repo,
            startDate: sessionStart,
            endDate: sessionEnd,
            totalCommits,
            dailyCommits: new Map(sessionCommits),
            color: repoColors[repo] || "#6b7280",
          })
        }

        // Start new session
        sessionStart = sortedDates[i]
        sessionEnd = sortedDates[i]
        sessionCommits = new Map()
        totalCommits = 0
        addCommit(sessionStart)
      }
    }

    // Don't forget the last session
    const startD = new Date(sessionStart)
    const endD = new Date(sessionEnd)
    const duration = Math.floor((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24)) + 1

    if (duration >= 2 && totalCommits >= 3) {
      sessions.push({
        repo,
        startDate: sessionStart,
        endDate: sessionEnd,
        totalCommits,
        dailyCommits: new Map(sessionCommits),
        color: repoColors[repo] || "#6b7280",
      })
    }
  })

  // Sort by start date
  return sessions.sort((a, b) => a.startDate.localeCompare(b.startDate))
}

// Get contribution level color (GitHub green palette)
export function getContributionBg(level: 0 | 1 | 2 | 3 | 4, isDark: boolean): string {
  if (isDark) {
    switch (level) {
      case 0:
        return "rgba(22, 27, 34, 0.6)"
      case 1:
        return "rgba(14, 68, 41, 0.8)"
      case 2:
        return "rgba(0, 109, 50, 0.85)"
      case 3:
        return "rgba(38, 166, 65, 0.9)"
      case 4:
        return "rgba(57, 211, 83, 0.95)"
    }
  } else {
    switch (level) {
      case 0:
        return "rgba(235, 237, 240, 0.5)"
      case 1:
        return "rgba(155, 233, 168, 0.7)"
      case 2:
        return "rgba(64, 196, 99, 0.75)"
      case 3:
        return "rgba(48, 161, 78, 0.8)"
      case 4:
        return "rgba(33, 110, 57, 0.85)"
    }
  }
}
