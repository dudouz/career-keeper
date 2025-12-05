import type { Brag, BragReviewStatus, BragType } from "@/lib/db/types"

export interface GetBragsParams {
  userId: string
  reviewStatus?: BragReviewStatus
  type?: BragType
  limit?: number
  offset?: number
}

export interface GetBragsResult {
  brags: Brag[]
  total: number
}

export interface CreateBragParams {
  userId: string
  type: BragType
  title: string
  description?: string
  date: Date
  repository: string
  url: string
  githubId?: string
  githubType: string
}

export interface UpdateBragReviewParams {
  bragId: string
  userId: string
  relevance?: number
  resumeSectionId?: string | null
  techTags?: string[]
  customDescription?: string | null
}

export interface BragStatsResult {
  pending: number
  reviewed: number
  archived: number
  total: number
}

export interface SyncBragsFromGitHubParams {
  userId: string
}

export interface BulkUpdateBragsParams {
  userId: string
  bragIds: string[]
  relevance?: number
  resumeSectionId?: string | null
  techTags?: string[]
  reviewStatus?: BragReviewStatus
}
