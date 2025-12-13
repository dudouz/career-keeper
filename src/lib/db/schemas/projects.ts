import { boolean, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { users } from "./users"

// Project model - represents a selected repository for analysis
export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  
  // Repository information
  repositoryName: text("repository_name").notNull(), // Full name: owner/repo
  repositoryUrl: text("repository_url").notNull(),
  description: text("description"), // Repository description
  language: text("language"), // Primary language
  stars: text("stars"), // Number of stars (stored as text for large numbers)
  
  // User-defined project metadata
  projectName: text("project_name"), // Custom name for the project (defaults to repo name)
  notes: text("notes"), // User notes about this project
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
})

