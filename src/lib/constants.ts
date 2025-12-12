// Authentication Constants
export const AUTH = {
  SESSION_MAX_AGE_DAYS: 30,
  SESSION_MAX_AGE_SECONDS: 30 * 24 * 60 * 60, // 30 days in seconds
} as const

// GitHub API Constants
export const GITHUB = {
  MAX_REPOS_FOR_MVP: 10,
  REPOS_PER_PAGE: 100,
  COMMITS_PER_PAGE: 50,
  PRS_PER_PAGE: 50,
  ISSUES_PER_PAGE: 50,
} as const

// LLM/OpenAI Constants
export const LLM = {
  DEFAULT_MODEL: "gpt-4-turbo-preview",
  MAX_REPOS_IN_PROMPT: 5,
  MAX_RECENT_COMMITS: 10,
  MAX_DESCRIPTION_LENGTH: 200,
  TEMPERATURE: {
    ANALYSIS: 1,
    CREATIVE: 1,
    DEFAULT: 1,
  },
  TOKENS_PER_CHAR: 0.25, // Roughly 4 chars per token
} as const

// Export/PDF Constants
export const EXPORT = {
  PDF: {
    PAGE_WIDTH: 210, // A4 width in mm
    PAGE_HEIGHT: 297, // A4 height in mm
    MARGIN: 20,
    LINE_HEIGHT: 7,
    FONT_SIZES: {
      TITLE: 20,
      HEADING: 14,
      SUBHEADING: 12,
      BODY: 10,
    },
  },
  TXT: {
    LINE_WIDTH: 80,
    SECTION_SPACING: 2,
  },
} as const

// Rate Limiting Constants
export const RATE_LIMIT = {
  MAX_REQUESTS_PER_MINUTE: 10,
  WINDOW_MS: 60 * 1000, // 1 minute in milliseconds
} as const

// Pagination Constants
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_VISIBLE_PAGES: 7,
  PAGES_NEAR_START_THRESHOLD: 3,
  PAGES_NEAR_START_MAX: 4,
  PAGES_NEAR_END_THRESHOLD: 2,
  PAGES_NEAR_END_OFFSET: 3,
} as const
