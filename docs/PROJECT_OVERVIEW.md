# Annual Calendar 2026

A comprehensive year-at-a-glance calendar application built with Next.js 16, React 19, and Sanity CMS. Designed for the Sanity + Vercel hackathon, this project showcases a creative blend of personal calendar management with GitHub activity visualization.

## Overview

Annual Calendar 2026 is a full-featured calendar application that displays an entire year in a continuous grid layout, similar to GitHub's contribution heatmap but with full event management capabilities. It features dual views: a traditional calendar view for personal events and a GitHub activity view that visualizes your coding contributions throughout the year.

## Key Features

### Calendar View

#### Year Grid Layout
- **21x18 grid** displaying all 365 days of the year in a continuous flow
- Each cell represents a single day with:
  - Day name (SUN, MON, etc.)
  - Day number
  - Month badge on the first of each month
  - Visual indicators for today, weekends, and past days

#### Event Management
- **Create events** by clicking on any day or dragging across multiple days
- **Edit events** by clicking on existing event bars
- **Drag and drop** events to reschedule them
- **Resize events** by dragging the left/right edges
- **Multi-day events** displayed as horizontal swimlanes spanning multiple cells
- **Tag-based categorization** with color coding (8 preset colors)
- **Context menu** with quick actions:
  - Edit event
  - Delete event
  - Duplicate event
  - Change tag/color
  - Extend by one day
  - Shorten by one day

#### Drag-to-Select (Notion-style)
- Click and drag across multiple cells to select a date range
- Visual preview swimlane shows where the event will be created
- Release to open the event creation modal with dates pre-filled
- Smooth UX similar to Notion Calendar

#### Daily Attachments
- **Photo of the day**: Upload an image for any day (stored in Vercel Blob + Sanity)
- **Journal entry**: Add text notes to any day
- Photos display as cell backgrounds with proper aspect ratio
- Notes accessible via hover tooltip or dedicated modal

#### AI-Powered Features
- **AI Dock** at bottom of screen for natural language event creation
- Type commands like "Add birthday party on March 25th" 
- AI parses the text and creates properly formatted events
- Quick actions: Clear all events, Load sample data

#### Visual Features
- **Today highlight**: Inverted colors (dark in light mode, light in dark mode)
- **Past days**: Subtle diagonal stripe pattern
- **Weekends**: Slightly darker background
- **Month separators**: Vertical line with contrasting color
- **Pulsing animation** when jumping to today

### GitHub View

A unique visualization that transforms your GitHub activity into a calendar-like experience.

#### GitHub Activity Swimlanes
- **Repository swimlanes** showing when you worked on each project
- Visual indication of activity intensity via opacity
- Each repo gets a unique color from the tag palette
- Maximum 2 swimlanes per day to avoid visual clutter

#### Commit Heat Indicators
- Small colored squares in the top-left of each cell
- Green intensity (GitHub-style) based on commit count
- Level 0 (no commits) through Level 4 (high activity)

#### Detailed Tooltips
- Hover on any day to see:
  - Total commits
  - Lines added/deleted
  - PRs opened/merged
  - Repositories contributed to

#### Stats Dialog
- Accessible via "Stats" button in header
- Shows annual summary:
  - Total commits
  - PRs merged
  - Lines of code added/deleted
  - Current streak
  - Longest streak
  - Activity legend

#### Filtering
- Filter by repository to focus on specific projects
- Badge shows number of active filters

### Data Persistence

All data is persisted to **Sanity CMS** with the following schema:

#### `calendarEvent`
- `title` (string, required)
- `description` (text)
- `startDate` (date, required)
- `endDate` (date, required)
- `tag` (reference to `tag` document)

#### `tag`
- `name` (string, required)
- `slug` (slug, required)
- `color` (string)

#### `dayPhoto`
- `date` (date, required)
- `externalImageUrl` (url) - for Vercel Blob URLs
- `image` (image with hotspot) - for native Sanity images
- `caption` (string)

#### `dayNote`
- `date` (date, required)
- `content` (text, required)

### Technical Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4, shadcn/ui components
- **CMS**: Sanity (content management)
- **Storage**: Vercel Blob (image uploads)
- **State Management**: SWR for data fetching, React state for local UI
- **Animations**: Framer Motion for smooth interactions
- **Icons**: Lucide React

### Responsive Design

- **Desktop**: Full year grid with all features
- **Mobile**: Drawer-based modals instead of sheets
- Uses `useMediaQuery` hook for responsive behavior
- Touch-friendly interactions

### Dark Mode

Full dark mode support with:
- Proper color inversions for readability
- Adjusted opacity values for visual balance
- Custom CSS variables for theme tokens
- Persisted via `next-themes`

## API Routes

### Events
- `GET /api/events` - Fetch all events
- `POST /api/events` - Create new event
- `PATCH /api/events/[id]` - Update event
- `DELETE /api/events/[id]` - Delete event

### Tags
- `GET /api/tags` - Fetch all tags

### Notes
- `GET /api/notes` - Fetch all notes
- `POST /api/notes` - Create/update note
- `PATCH /api/notes` - Update note
- `DELETE /api/notes?date=YYYY-MM-DD` - Delete note

### Photos
- `GET /api/photos` - Fetch all photos
- `POST /api/photos` - Create/update photo
- `DELETE /api/photos?date=YYYY-MM-DD` - Delete photo (from both Blob and Sanity)

### AI
- `POST /api/parse-events` - Parse natural language into events

### Upload
- `POST /api/upload` - Upload image to Vercel Blob

## Future Integration Plans

See `docs/integration-plan.md` for detailed plans on:
- **Clerk Authentication** with OAuth tokens
- **Google Calendar** sync (bidirectional)
- **GitHub API** integration for real data
- Real-time updates via Sanity listeners

## Usage

1. **Navigate years**: Use the `<` `>` buttons or click the year
2. **Switch views**: Click "Calendar" or "GitHub" tabs
3. **Create event**: Click a day or drag across multiple days
4. **Edit event**: Click on any event swimlane
5. **Quick actions**: Right-click on events for context menu
6. **Add photo**: Hover over a day and click the camera icon
7. **Add note**: Hover over a day and click the note icon
8. **Use AI**: Type in the AI dock at the bottom
9. **Filter**: Use the Filter button to show/hide tags or repos
10. **Jump to today**: The calendar auto-scrolls to show current date

## Performance Optimizations

- **Memoization**: Heavy computations cached with `useMemo`
- **Callback stability**: Event handlers wrapped in `useCallback`
- **Optimistic updates**: Local state updates before API calls
- **SWR caching**: Efficient data revalidation
- **CSS containment**: Grid cells isolated for paint optimization
- **Lazy loading**: Components loaded on demand

## Hackathon Highlights

This project demonstrates:
1. **Creative Sanity usage**: Calendar events, photos, and journal entries all managed via Sanity
2. **Vercel ecosystem**: Blob storage, serverless functions, edge-ready
3. **Innovative UX**: Year-at-a-glance with GitHub heatmap inspiration
4. **AI integration**: Natural language event creation
5. **Polish**: Dark mode, animations, responsive design
