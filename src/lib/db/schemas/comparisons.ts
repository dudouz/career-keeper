import { index, jsonb, pgTable, timestamp, uuid } from "drizzle-orm/pg-core"
import { users } from "./users"
import { resumes } from "./resumes"

// Comparison model
export const comparisons = pgTable("comparisons", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  resumeId: uuid("resume_id")
    .notNull()
    .references(() => resumes.id, { onDelete: "cascade" }),
  comparisonData: jsonb("comparison_data").notNull(),
  comparisonHistory: jsonb("comparison_history").notNull().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const comparisonHistory = pgTable(
  "comparison_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    comparisonId: uuid("comparison_id").notNull(),
    comparisonData: jsonb("comparison_data").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("comparison_id_index").on(table.comparisonId)]
)

// Relations will be defined in schema.ts to avoid circular dependencies

