import { relations } from "drizzle-orm"
import { boolean, index, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

// User model - OAuth-only authentication
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  image: text("image"), // Profile image from OAuth
  emailVerified: timestamp("email_verified"), // Changed to timestamp for NextAuth compatibility
  githubPat: text("github_pat"), // Encrypted GitHub Personal Access Token
  githubUsername: text("github_username"), // GitHub username
  openaiApiKey: text("openai_api_key"), // Encrypted OpenAI API key
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  subscriptionTier: text("subscription_tier").default("basic").notNull(), // 'basic' or 'premium'
  subscriptionStatus: text("subscription_status").default("active"), // 'active', 'cancelled', 'past_due'
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
})

// OAuth Accounts (for NextAuth)
export const accounts = pgTable("accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'oauth' | 'email' | 'credentials'
  provider: text("provider").notNull(), // 'google' | 'github'
  providerAccountId: text("provider_account_id").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
})

// Sessions (for NextAuth)
export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionToken: text("session_token").notNull().unique(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires").notNull(),
})

// Verification Tokens (for email verification)
export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull().unique(),
  expires: timestamp("expires").notNull(),
})

// Resume model
export const resumes = pgTable("resumes", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: jsonb("content").notNull(), // Structured resume content
  rawContent: text("raw_content"), // Original uploaded content
  fileName: text("file_name"),
  fileType: text("file_type"), // 'pdf', 'docx', 'txt'
  fileUrl: text("file_url"), // Vercel Blob or S3 URL
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

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

// Resume Version model (for Premium tier)
export const resumeVersions = pgTable("resume_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  resumeId: uuid("resume_id")
    .notNull()
    .references(() => resumes.id, { onDelete: "cascade" }),
  versionNumber: integer("version_number").notNull(),
  content: jsonb("content").notNull(),
  notes: text("notes"),
  tagName: text("tag_name"), // User-defined version tag
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// Resume History model (automatic change tracking)
export const resumeHistory = pgTable(
  "resume_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    resumeId: uuid("resume_id")
      .notNull()
      .references(() => resumes.id, { onDelete: "cascade" }),
    content: jsonb("content").notNull(), // Snapshot do conteúdo
    rawContent: text("raw_content"), // Snapshot do conteúdo raw
    changeType: text("change_type"), // 'created', 'updated', 'deleted'
    changedFields: jsonb("changed_fields"), // Campos que mudaram
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("resume_id_index").on(table.resumeId)]
)

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

// Relations
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
