import { relations } from "drizzle-orm"

// Import all tables from split schema files
export { accounts, sessions, users, userSessions, verificationTokens } from "./schemas/users"

export { resumeHistory, resumes, resumeSections, resumeVersions } from "./schemas/resumes"

export { comparisonHistory, comparisons } from "./schemas/comparisons"

export { githubContributions } from "./schemas/github"

export { achievements } from "./schemas/achievements"

// Import tables for relations (not exported)
import { achievements } from "./schemas/achievements"
import { comparisonHistory, comparisons } from "./schemas/comparisons"
import { githubContributions } from "./schemas/github"
import { resumes, resumeSections, resumeVersions } from "./schemas/resumes"
import { sessions, users, userSessions } from "./schemas/users"

// Relations - defined here to avoid circular dependencies
export const usersRelations = relations(users, ({ many }) => ({
  resumes: many(resumes),
  githubContributions: many(githubContributions),
  achievements: many(achievements),
  sessions: many(sessions),
  userSessions: many(userSessions),
}))

export const resumesRelations = relations(resumes, ({ one, many }) => ({
  user: one(users, {
    fields: [resumes.userId],
    references: [users.id],
  }),
  sections: many(resumeSections),
  versions: many(resumeVersions),
}))

export const resumeSectionsRelations = relations(resumeSections, ({ one, many }) => ({
  resume: one(resumes, {
    fields: [resumeSections.resumeId],
    references: [resumes.id],
  }),
  achievements: many(achievements),
}))

export const achievementsRelations = relations(achievements, ({ one }) => ({
  user: one(users, {
    fields: [achievements.userId],
    references: [users.id],
  }),
  resumeSection: one(resumeSections, {
    fields: [achievements.resumeSectionId],
    references: [resumeSections.id],
  }),
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

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  user: one(users, {
    fields: [userSessions.userId],
    references: [users.id],
  }),
}))
