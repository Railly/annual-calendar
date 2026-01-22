import { auth, clerkClient } from "@clerk/nextjs/server"
import { Octokit } from "@octokit/rest"

export async function getGitHubClient() {
  const { userId } = await auth()
  if (!userId) throw new Error("Not authenticated")

  const client = await clerkClient()
  const tokens = await client.users.getUserOauthAccessToken(userId, "github")
  const accessToken = tokens.data[0]?.token
  if (!accessToken) throw new Error("GitHub not connected")

  return new Octokit({ auth: accessToken })
}

export async function getGitHubUsername(): Promise<string> {
  const octokit = await getGitHubClient()
  const { data } = await octokit.users.getAuthenticated()
  return data.login
}

export interface ContributionDay {
  date: string
  contributionCount: number
  color: string
}

export interface ContributionWeek {
  contributionDays: ContributionDay[]
}

export interface ContributionCalendar {
  totalContributions: number
  weeks: ContributionWeek[]
}

export interface GitHubContributionResponse {
  user: {
    contributionsCollection: {
      contributionCalendar: ContributionCalendar
      totalCommitContributions: number
      totalPullRequestContributions: number
      totalPullRequestReviewContributions: number
      totalIssueContributions: number
      totalRepositoryContributions: number
    }
  }
}

const CONTRIBUTION_QUERY = `
query($username: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $username) {
    contributionsCollection(from: $from, to: $to) {
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            date
            contributionCount
            color
          }
        }
      }
      totalCommitContributions
      totalPullRequestContributions
      totalPullRequestReviewContributions
      totalIssueContributions
      totalRepositoryContributions
    }
  }
}
`

export async function fetchGitHubContributions(year: number) {
  const octokit = await getGitHubClient()
  const username = await getGitHubUsername()

  const from = new Date(year, 0, 1).toISOString()
  const to = new Date(year, 11, 31, 23, 59, 59).toISOString()

  const response = await octokit.graphql<GitHubContributionResponse>(CONTRIBUTION_QUERY, {
    username,
    from,
    to,
  })

  return response.user.contributionsCollection
}

export function getContributionLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0
  if (count <= 3) return 1
  if (count <= 6) return 2
  if (count <= 9) return 3
  return 4
}
