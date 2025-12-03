import * as dotenv from "dotenv"
import type { Config } from "drizzle-kit"
import fs from "fs"

// load .env.local if it exists
if (fs.existsSync(".env.local")) {
  dotenv.config({ path: ".env.local" })
}
// Load .env

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
