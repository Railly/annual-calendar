import { generateObject } from "ai"
import { z } from "zod"

const eventsSchema = z.object({
  events: z.array(
    z.object({
      title: z.string().describe("Title of the event"),
      description: z.string().optional().describe("Optional description"),
      startDate: z.string().describe("Start date in YYYY-MM-DD format"),
      endDate: z.string().describe("End date in YYYY-MM-DD format"),
      tag: z
        .enum(["travel", "holiday", "family", "work", "school", "birthday", "reminder", "important"])
        .describe("Category tag for the event"),
    }),
  ),
})

export async function POST(req: Request) {
  const { prompt, year } = await req.json()

  const { object } = await generateObject({
    model: "openai/gpt-4o-mini",
    schema: eventsSchema,
    prompt: `You are a calendar assistant. Parse the following natural language input and extract calendar events. 
The current year context is ${year}. If no year is specified, use ${year}.
Convert relative dates like "next week", "tomorrow", "this friday" to actual dates.
Infer the most appropriate category tag based on the event content.

User input: "${prompt}"

Extract all events mentioned, even if there are multiple. Be smart about date ranges vs single day events.`,
    maxOutputTokens: 1000,
  })

  return Response.json(object)
}
