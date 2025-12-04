import { integer, jsonb, pgTable, timestamp, uuid } from "drizzle-orm/pg-core"
import { users } from "./users"

// GitHub Contribution model (temporary cache)
export const githubContributions = pgTable("github_contributions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  data: jsonb("data").notNull(), // Cached GitHub contribution data
  lastScanned: timestamp("last_scanned").defaultNow().notNull(),
  scanCount: integer("scan_count").default(0).notNull(), // Track monthly scan limit
  expiresAt: timestamp("expires_at").notNull(), // Auto-cleanup old cache
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// Relations will be defined in schema.ts to avoid circular dependencies

