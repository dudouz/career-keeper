import type { GitHubContributionData } from "@/lib/db/types"

export interface AnalyzeContributionsParams {
  userId: string
  contributions: GitHubContributionData
}

export interface AnalyzeContributionsResult {
  achievements: string[]
  skills: string[]
  projects: Array<{ name: string; description: string; highlights: string[] }>
  estimatedTokens: number
}

export interface GenerateSummaryParams {
  userId: string
  contributions: GitHubContributionData
  currentSummary?: string
  tone?: "technical" | "leadership" | "hybrid"
}

export interface GenerateSummaryResult {
  summary: string
  alternatives: string[]
  estimatedTokens: number
}

export interface CompareResumeParams {
  userId: string
  existingResume: string
  contributions: GitHubContributionData
}

export interface CompareResumeResult {
  missingAchievements: string[]
  outdatedSections: string[]
  suggestions: string[]
  estimatedTokens: number
}

export type { GitHubContributionData }
