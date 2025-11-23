import type { InferSelectModel, InferInsertModel } from "drizzle-orm"
import type {
  users,
  resumes,
  resumeVersions,
  githubContributions,
  userSessions,
} from "./schema"

// Select types (reading from database)
export type User = InferSelectModel<typeof users>
export type Resume = InferSelectModel<typeof resumes>
export type ResumeVersion = InferSelectModel<typeof resumeVersions>
export type GitHubContribution = InferSelectModel<typeof githubContributions>
export type UserSession = InferSelectModel<typeof userSessions>

// Insert types (writing to database)
export type NewUser = InferInsertModel<typeof users>
export type NewResume = InferInsertModel<typeof resumes>
export type NewResumeVersion = InferInsertModel<typeof resumeVersions>
export type NewGitHubContribution = InferInsertModel<typeof githubContributions>
export type NewUserSession = InferInsertModel<typeof userSessions>

// Subscription tiers
export type SubscriptionTier = "basic" | "premium"
export type SubscriptionStatus = "active" | "cancelled" | "past_due"

// Resume content structure
export interface ResumeContent {
  summary?: string
  experience?: ExperienceItem[]
  projects?: ProjectItem[]
  skills?: string[]
  education?: EducationItem[]
  certifications?: string[]
  awards?: string[]
  customSections?: CustomSection[]
}

export interface ExperienceItem {
  company: string
  position: string
  startDate: string
  endDate?: string
  description: string
  highlights?: string[]
}

export interface ProjectItem {
  name: string
  description: string
  technologies?: string[]
  url?: string
  highlights?: string[]
}

export interface EducationItem {
  institution: string
  degree: string
  field?: string
  startDate?: string
  endDate?: string
  gpa?: string
}

export interface CustomSection {
  title: string
  content: string
}

// GitHub contribution data structure
export interface GitHubContributionData {
  repositories: Repository[]
  commits: Commit[]
  pullRequests: PullRequest[]
  issues: Issue[]
  releases: Release[]
  languages: Record<string, number>
  totalContributions: number
  scannedAt: string
}

export interface Repository {
  name: string
  description?: string
  url: string
  language?: string
  stars: number
  forks: number
}

export interface Commit {
  sha: string
  message: string
  date: string
  repository: string
  url: string
}

export interface PullRequest {
  number: number
  title: string
  state: string
  createdAt: string
  closedAt?: string
  repository: string
  url: string
}

export interface Issue {
  number: number
  title: string
  state: string
  createdAt: string
  closedAt?: string
  repository: string
  url: string
}

export interface Release {
  tagName: string
  name: string
  body?: string
  createdAt: string
  repository: string
  url: string
  downloadCount?: number
}

