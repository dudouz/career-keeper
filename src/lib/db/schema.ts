import { relations } from "drizzle-orm"

// Import all tables from split schema files
export { accounts, sessions, users, verificationTokens } from "./schemas/users"

export { resumeHistory, resumes, resumeVersions } from "./schemas/resumes"

export { comparisonHistory, comparisons } from "./schemas/comparisons"

export { githubContributions } from "./schemas/github"

// Import tables for relations (not exported)
import { comparisonHistory, comparisons } from "./schemas/comparisons"
import { githubContributions } from "./schemas/github"
import { resumes, resumeVersions } from "./schemas/resumes"
import { users } from "./schemas/users"

// Relations - defined here to avoid circular dependencies
export const usersRelations = relations(users, ({ many }) => ({
  resumes: many(resumes),
  githubContributions: many(githubContributions),
  // sessions: many(userSessions),
}))

export const resumesRelations = relations(resumes, ({ one, many }) => ({
  user: one(users, {
    fields: [resumes.userId],
    references: [users.id],
  }),
  versions: many(resumeVersions),
}))

export const resumeVersionsRelations = relations(resumeVersions, ({ one }) => ({
  resume: one(resumes, {
    fields: [resumeVersions.resumeId],
    references: [resumes.id],
  }),
}))

export const githubContributionsRelations = relations(githubContributions, ({ one }) => ({
  user: one(users, {
    fields: [githubContributions.userId],
    references: [users.id],
  }),
}))

export const comparisonsRelations = relations(comparisons, ({ one, many }) => ({
  user: one(users, {
    fields: [comparisons.userId],
    references: [users.id],
  }),
  resume: one(resumes, {
    fields: [comparisons.resumeId],
    references: [resumes.id],
  }),
  history: many(comparisonHistory),
}))
