import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

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

// Relations will be defined in schema.ts to avoid circular dependencies

