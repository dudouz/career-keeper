import type { Config } from "drizzle-kit"
import * as dotenv from "dotenv"

// Load .env.local first (for Next.js convention), then fall back to .env
dotenv.config({ path: ".env.local" })
dotenv.config()

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set")
}

export default {
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
} satisfies Config

