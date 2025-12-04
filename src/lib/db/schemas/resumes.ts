import { boolean, index, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { users } from "./users"

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

// Relations will be defined in schema.ts to avoid circular dependencies

