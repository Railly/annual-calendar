# Calendar Integration Plan: Google Calendar & GitHub with Clerk Auth

This document outlines a comprehensive plan for integrating the Annual Calendar 2026 app with Google Calendar and GitHub using Clerk for authentication and OAuth token management.

---

## Executive Summary

Using **Clerk** as our authentication provider enables secure OAuth flows with Google and GitHub. Clerk stores and manages OAuth tokens on behalf of users, allowing our backend to access Google Calendar and GitHub APIs without handling tokens directly. All calendar and contribution data syncs to **Sanity** as the central content hub.

---

## Part 1: Clerk Authentication Setup

### 1.1 Why Clerk?

- **Built-in OAuth Providers**: Google, GitHub, and 20+ providers out-of-the-box
- **Secure Token Storage**: OAuth access/refresh tokens stored securely by Clerk
- **Backend API Access**: Retrieve user tokens via Clerk Backend API for server-side API calls
- **Session Management**: Handles session refresh, token rotation automatically
- **Next.js Integration**: First-class support with `@clerk/nextjs`

### 1.2 Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  User Browser   │────►│  Clerk Auth     │────►│  OAuth Provider │
│                 │     │  (Frontend)     │     │  (Google/GitHub)│
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Sanity CMS     │◄───►│  Next.js API    │◄────│  Clerk Backend  │
│  (Data Store)   │     │  Routes         │     │  API (Tokens)   │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### 1.3 Implementation Steps

#### Step 1: Install Clerk

```bash
npm install @clerk/nextjs
```

#### Step 2: Environment Variables

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

#### Step 3: Configure OAuth Providers in Clerk Dashboard

1. Go to Clerk Dashboard → User & Authentication → Social Connections
2. Enable **Google** with scopes:
   - `https://www.googleapis.com/auth/calendar.readonly`
   - `https://www.googleapis.com/auth/calendar.events`
3. Enable **GitHub** with scopes:
   - `read:user`
   - `repo` (for private repo contributions)
   - `read:org` (optional, for org contributions)

#### Step 4: Wrap App with ClerkProvider

```typescript
// app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
```

#### Step 5: Protect Routes with Middleware

```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)'])

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) auth().protect()
})

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
```

---

## Part 2: Google Calendar Integration

### 2.1 Getting OAuth Token from Clerk

```typescript
// lib/google-calendar.ts
import { auth, clerkClient } from '@clerk/nextjs/server'
import { google } from 'googleapis'

export async function getGoogleCalendarClient() {
  const { userId } = auth()
  if (!userId) throw new Error('Not authenticated')

  // Get OAuth token from Clerk
  const clerkResponse = await clerkClient.users.getUserOauthAccessToken(
    userId,
    'oauth_google'
  )
  
  const accessToken = clerkResponse.data[0]?.token
  if (!accessToken) throw new Error('Google not connected')

  // Create Google OAuth client
  const oauth2Client = new google.auth.OAuth2()
  oauth2Client.setCredentials({ access_token: accessToken })

  return google.calendar({ version: 'v3', auth: oauth2Client })
}
```

### 2.2 API Routes

#### Fetch Google Calendar Events

```typescript
// app/api/google/events/route.ts
import { NextResponse } from 'next/server'
import { getGoogleCalendarClient } from '@/lib/google-calendar'
import { sanityClient } from '@/lib/sanity'

export async function GET(req: Request) {
  try {
    const calendar = await getGoogleCalendarClient()
    const { searchParams } = new URL(req.url)
    const year = searchParams.get('year') || new Date().getFullYear().toString()

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: `${year}-01-01T00:00:00Z`,
      timeMax: `${year}-12-31T23:59:59Z`,
      maxResults: 2500,
      singleEvents: true,
      orderBy: 'startTime',
    })

    const events = response.data.items?.map(event => ({
      id: event.id,
      title: event.summary || 'Untitled',
      description: event.description,
      startDate: event.start?.date || event.start?.dateTime?.split('T')[0],
      endDate: event.end?.date || event.end?.dateTime?.split('T')[0],
      source: 'google',
      googleEventId: event.id,
    })) || []

    return NextResponse.json({ events })
  } catch (error) {
    console.error('Error fetching Google Calendar:', error)
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}
```

#### Sync to Sanity (Overwrite Pattern)

```typescript
// app/api/google/sync/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getGoogleCalendarClient } from '@/lib/google-calendar'
import { sanityClient } from '@/lib/sanity'

export async function POST(req: Request) {
  try {
    const { userId } = auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const calendar = await getGoogleCalendarClient()
    const year = new Date().getFullYear()

    // Fetch all Google Calendar events
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: `${year}-01-01T00:00:00Z`,
      timeMax: `${year}-12-31T23:59:59Z`,
      maxResults: 2500,
      singleEvents: true,
    })

    const googleEvents = response.data.items || []

    // Delete existing Google-sourced events for this user
    const existingEvents = await sanityClient.fetch(
      `*[_type == "calendarEvent" && source == "google" && userId == $userId]._id`,
      { userId }
    )
    
    if (existingEvents.length > 0) {
      const transaction = sanityClient.transaction()
      existingEvents.forEach((id: string) => transaction.delete(id))
      await transaction.commit()
    }

    // Create new events from Google Calendar
    const transaction = sanityClient.transaction()
    
    for (const event of googleEvents) {
      if (!event.start?.date && !event.start?.dateTime) continue
      
      transaction.create({
        _type: 'calendarEvent',
        title: event.summary || 'Untitled',
        description: event.description || '',
        startDate: event.start.date || event.start.dateTime?.split('T')[0],
        endDate: event.end?.date || event.end?.dateTime?.split('T')[0] || event.start.date,
        source: 'google',
        googleEventId: event.id,
        userId,
      })
    }

    await transaction.commit()

    return NextResponse.json({ 
      success: true, 
      synced: googleEvents.length 
    })
  } catch (error) {
    console.error('Error syncing Google Calendar:', error)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}
```

### 2.3 Sanity Schema Extension

```typescript
// Add to calendarEvent schema
{
  name: 'source',
  type: 'string',
  title: 'Source',
  options: {
    list: [
      { title: 'Manual', value: 'manual' },
      { title: 'Google Calendar', value: 'google' },
      { title: 'GitHub', value: 'github' },
    ],
  },
},
{
  name: 'googleEventId',
  type: 'string',
  title: 'Google Event ID',
  hidden: true,
},
{
  name: 'userId',
  type: 'string',
  title: 'User ID',
  hidden: true,
},
```

---

## Part 3: GitHub Integration

### 3.1 Getting OAuth Token from Clerk

```typescript
// lib/github.ts
import { auth, clerkClient } from '@clerk/nextjs/server'
import { Octokit } from '@octokit/rest'

export async function getGitHubClient() {
  const { userId } = auth()
  if (!userId) throw new Error('Not authenticated')

  // Get OAuth token from Clerk
  const clerkResponse = await clerkClient.users.getUserOauthAccessToken(
    userId,
    'oauth_github'
  )
  
  const accessToken = clerkResponse.data[0]?.token
  if (!accessToken) throw new Error('GitHub not connected')

  return new Octokit({ auth: accessToken })
}
```

### 3.2 Fetch Real Contribution Data

```typescript
// app/api/github/contributions/route.ts
import { NextResponse } from 'next/server'
import { getGitHubClient } from '@/lib/github'

export async function GET(req: Request) {
  try {
    const octokit = await getGitHubClient()
    const { searchParams } = new URL(req.url)
    const year = searchParams.get('year') || new Date().getFullYear().toString()

    // Get authenticated user
    const { data: user } = await octokit.users.getAuthenticated()

    // Fetch contribution data via GraphQL
    const query = `
      query($username: String!, $from: DateTime!, $to: DateTime!) {
        user(login: $username) {
          contributionsCollection(from: $from, to: $to) {
            totalCommitContributions
            totalPullRequestContributions
            totalPullRequestReviewContributions
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  date
                  contributionCount
                  contributionLevel
                }
              }
            }
            commitContributionsByRepository(maxRepositories: 10) {
              repository {
                name
                primaryLanguage {
                  name
                  color
                }
              }
              contributions {
                totalCount
              }
            }
          }
        }
      }
    `

    const response = await octokit.graphql(query, {
      username: user.login,
      from: `${year}-01-01T00:00:00Z`,
      to: `${year}-12-31T23:59:59Z`,
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching GitHub contributions:', error)
    return NextResponse.json({ error: 'Failed to fetch contributions' }, { status: 500 })
  }
}
```

### 3.3 Sync GitHub Data to Sanity

```typescript
// app/api/github/sync/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getGitHubClient } from '@/lib/github'
import { sanityClient } from '@/lib/sanity'

export async function POST(req: Request) {
  try {
    const { userId } = auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const octokit = await getGitHubClient()
    const { data: user } = await octokit.users.getAuthenticated()
    const year = new Date().getFullYear()

    // Fetch contribution data
    const query = `
      query($username: String!, $from: DateTime!, $to: DateTime!) {
        user(login: $username) {
          contributionsCollection(from: $from, to: $to) {
            contributionCalendar {
              weeks {
                contributionDays {
                  date
                  contributionCount
                  contributionLevel
                }
              }
            }
          }
        }
      }
    `

    const response: any = await octokit.graphql(query, {
      username: user.login,
      from: `${year}-01-01T00:00:00Z`,
      to: `${year}-12-31T23:59:59Z`,
    })

    // Delete existing GitHub data for this user/year
    const existingData = await sanityClient.fetch(
      `*[_type == "githubActivity" && userId == $userId && year == $year]._id`,
      { userId, year }
    )
    
    if (existingData.length > 0) {
      const transaction = sanityClient.transaction()
      existingData.forEach((id: string) => transaction.delete(id))
      await transaction.commit()
    }

    // Store contribution data in Sanity
    const weeks = response.user.contributionsCollection.contributionCalendar.weeks
    const contributions: any[] = []

    weeks.forEach((week: any) => {
      week.contributionDays.forEach((day: any) => {
        if (day.contributionCount > 0) {
          contributions.push({
            _type: 'githubActivity',
            date: day.date,
            commits: day.contributionCount,
            level: ['NONE', 'FIRST_QUARTILE', 'SECOND_QUARTILE', 'THIRD_QUARTILE', 'FOURTH_QUARTILE'].indexOf(day.contributionLevel),
            userId,
            year,
          })
        }
      })
    })

    // Batch create
    const transaction = sanityClient.transaction()
    contributions.forEach(c => transaction.create(c))
    await transaction.commit()

    return NextResponse.json({ 
      success: true, 
      synced: contributions.length 
    })
  } catch (error) {
    console.error('Error syncing GitHub data:', error)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}
```

### 3.4 Sanity Schema for GitHub Activity

```typescript
// schemas/githubActivity.ts
export default {
  name: 'githubActivity',
  type: 'document',
  title: 'GitHub Activity',
  fields: [
    { name: 'date', type: 'date', title: 'Date' },
    { name: 'commits', type: 'number', title: 'Commits' },
    { name: 'prsOpened', type: 'number', title: 'PRs Opened' },
    { name: 'prsMerged', type: 'number', title: 'PRs Merged' },
    { name: 'linesAdded', type: 'number', title: 'Lines Added' },
    { name: 'linesDeleted', type: 'number', title: 'Lines Deleted' },
    { name: 'level', type: 'number', title: 'Contribution Level' },
    { name: 'repos', type: 'array', of: [{ type: 'string' }], title: 'Repositories' },
    { name: 'userId', type: 'string', title: 'User ID' },
    { name: 'year', type: 'number', title: 'Year' },
  ],
}
```

---

## Part 4: UI Components

### 4.1 Connection Status Component

```typescript
// components/integration-status.tsx
'use client'

import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'

export function IntegrationStatus() {
  const { user } = useUser()
  
  const googleConnected = user?.externalAccounts.some(
    acc => acc.provider === 'oauth_google'
  )
  const githubConnected = user?.externalAccounts.some(
    acc => acc.provider === 'oauth_github'
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="flex items-center gap-3">
          <GoogleIcon className="h-6 w-6" />
          <div>
            <p className="font-medium">Google Calendar</p>
            <p className="text-sm text-muted-foreground">
              {googleConnected ? 'Connected' : 'Not connected'}
            </p>
          </div>
        </div>
        {googleConnected ? (
          <Button variant="outline" onClick={handleGoogleSync}>
            Sync Now
          </Button>
        ) : (
          <Button onClick={() => window.Clerk?.openSignIn()}>
            Connect
          </Button>
        )}
      </div>

      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="flex items-center gap-3">
          <GitHubIcon className="h-6 w-6" />
          <div>
            <p className="font-medium">GitHub</p>
            <p className="text-sm text-muted-foreground">
              {githubConnected ? 'Connected' : 'Not connected'}
            </p>
          </div>
        </div>
        {githubConnected ? (
          <Button variant="outline" onClick={handleGitHubSync}>
            Sync Now
          </Button>
        ) : (
          <Button onClick={() => window.Clerk?.openSignIn()}>
            Connect
          </Button>
        )}
      </div>
    </div>
  )
}
```

---

## Part 5: Hackathon Strategy

### 5.1 Judging Criteria Alignment

| Category | How We Excel |
|----------|--------------|
| **Best End-User Experience** | Seamless OAuth with Clerk, one-click sync, beautiful UI with drag-drop, AI event creation, GitHub contribution visualization |
| **Most Creative Structured Content** | Events with tag relationships, GitHub activity as documents, multi-source data (Google + GitHub + Manual) unified in Sanity |
| **Best Overall** | Full-featured calendar with Clerk auth, multi-platform integration, demonstrating Sanity as the single source of truth |

### 5.2 Demo Flow

1. **Sign in with Clerk** (Google or GitHub OAuth)
2. **Show Calendar view** with existing events
3. **Connect Google Calendar** → One-click sync → Events appear
4. **Switch to GitHub tab** → Real contribution data from user's account
5. **AI Dock** → "Add vacation next week" → Creates event in Sanity
6. **Show Sanity Studio** → All data unified with proper relationships

### 5.3 Technical Differentiators

1. **Clerk OAuth**: Secure token management, no custom OAuth implementation
2. **Sanity as Hub**: All external data synced and stored in Sanity
3. **Overwrite Sync Pattern**: Each sync replaces old data, ensuring consistency
4. **Real GitHub Data**: Not dummy data - actual user contributions
5. **AI-Powered**: Natural language event creation

---

## Implementation Checklist

- [ ] Install and configure Clerk (`@clerk/nextjs`)
- [ ] Set up OAuth providers in Clerk Dashboard (Google + GitHub)
- [ ] Create middleware for protected routes
- [ ] Implement Google Calendar token retrieval
- [ ] Implement GitHub token retrieval
- [ ] Create sync API routes with overwrite pattern
- [ ] Extend Sanity schemas for source tracking
- [ ] Build integration status UI component
- [ ] Add sync buttons to calendar header
- [ ] Test full OAuth flow end-to-end
- [ ] Record demo video

---

## Security Notes

- OAuth tokens are stored securely by Clerk, never in our database
- All API routes use `auth()` to verify user identity
- Sanity data is scoped by `userId` to prevent cross-user access
- Consider adding Row Level Security for additional protection
