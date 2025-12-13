import { boolean, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { users } from "./users"
import { resumes } from "./resumes"
import { githubContributions } from "./github"
import { projects } from "./projects"

// User Snapshot model - combines resume and GitHub analysis data
export const userSnapshots = pgTable("user_snapshots", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  resumeId: uuid("resume_id").references(() => resumes.id, { onDelete: "set null" }),
  githubContributionId: uuid("github_contribution_id").references(() => githubContributions.id, {
    onDelete: "set null",
  }),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }), // Optional: link to a specific project

  // Career data from resume at snapshot time
  yearsOfExperience: integer("years_of_experience"),
  seniority: text("seniority"),
  focus: text("focus"),

  // Complete resume data snapshot (includes all sections)
  resumeData: jsonb("resume_data"), // Complete resume with all sections

  // Complete GitHub contributions data snapshot
  githubContributionsData: jsonb("github_contributions_data"), // Raw GitHub contributions data

  // GitHub XP analysis result
  githubAnalysis: jsonb("github_analysis"), // Result from agent analysis

  // User-defined title for the snapshot
  title: text("title"), // Optional custom title (defaults to date-based if not provided)

  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
})

