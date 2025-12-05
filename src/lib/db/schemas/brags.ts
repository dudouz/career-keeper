import { index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { resumeSections } from "./resumes"
import { users } from "./users"

// Brag model - GitHub contributions que podem ser revisados e usados no resume builder
export const brags = pgTable(
  "brags",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // Dados originais do GitHub
    type: text("type").notNull(), // 'commit' | 'pr' | 'issue' | 'release'
    title: text("title").notNull(),
    description: text("description"), // Descrição original (ex: body do release, commit message)
    date: timestamp("date").notNull(),
    repository: text("repository").notNull(),
    url: text("url").notNull(),

    // Identificadores únicos do GitHub (para evitar duplicatas)
    githubId: text("github_id"), // SHA para commits, number para PRs/issues, tagName para releases
    githubType: text("github_type").notNull(), // Tipo específico para identificar unicamente

    // Campos de revisão
    reviewStatus: text("review_status").default("pending").notNull(), // 'pending' | 'reviewed' | 'archived'
    relevance: integer("relevance"), // 1-5 ou null se não revisado
    resumeSectionId: uuid("resume_section_id").references(() => resumeSections.id, {
      onDelete: "set null",
    }), // Associar a uma experiência do currículo
    techTags: text("tech_tags").array(), // Array de tecnologias/tags
    customDescription: text("custom_description"), // Descrição customizada do que foi feito

    // Metadados
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    reviewedAt: timestamp("reviewed_at"), // Quando foi revisado
  },
  (table) => [
    index("brags_user_id_index").on(table.userId),
    index("brags_review_status_index").on(table.reviewStatus),
    index("brags_github_unique_index").on(table.userId, table.githubId, table.githubType),
  ]
)

// Relations will be defined in schema.ts to avoid circular dependencies
