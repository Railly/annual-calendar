import { createClient } from "@sanity/client"

export const sanityClient = createClient({
  projectId: "jtwugudr",
  dataset: "production",
  apiVersion: "2024-01-01",
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
})

export const sanityReadClient = createClient({
  projectId: "jtwugudr",
  dataset: "production",
  apiVersion: "2024-01-01",
  useCdn: false, // Changed from true to false for real-time data
})
