import type { Achievement, AchievementReviewStatus, AchievementType } from "@/lib/db/types"

export interface GetAchievementsParams {
  userId: string
  reviewStatus?: AchievementReviewStatus
  type?: AchievementType
  limit?: number
  offset?: number
}

export interface GetAchievementsResult {
  achievements: Achievement[]
  total: number
}

export interface CreateAchievementParams {
  userId: string
  type: AchievementType
  title: string
  description?: string
  date: Date
  repository: string
  url: string
  githubId?: string
  githubType: string
}

export interface UpdateAchievementReviewParams {
  achievementId: string
  userId: string
  relevance?: number
  resumeSectionId?: string | null
  techTags?: string[]
  customDescription?: string | null
}

export interface AchievementStatsResult {
  pending: number
  reviewed: number
  archived: number
  total: number
}

export interface SyncAchievementsFromGitHubParams {
  userId: string
}

export interface BulkUpdateAchievementsParams {
  userId: string
  achievementIds: string[]
  relevance?: number
  resumeSectionId?: string | null
  techTags?: string[]
  reviewStatus?: AchievementReviewStatus
}

