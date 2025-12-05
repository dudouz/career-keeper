import type { BragType } from "@/lib/db/types"

export type SortOrder = "newest" | "oldest" | "most-impact"
export type ReviewStatusFilter = "all" | "pending" | "reviewed" | "archived"

export interface BragListItem {
  id: string
  type: BragType
  title: string
  description?: string | null
  date: Date | string
  repository: string
  url: string
  reviewStatus: "pending" | "reviewed" | "archived"
  relevance?: number | null
  resumeSectionId?: string | null
  techTags?: string[] | null
  customDescription?: string | null
  createdAt: Date
  updatedAt: Date
  reviewedAt?: Date | null
}

export interface BragStats {
  pending: number
  reviewed: number
  archived: number
  total: number
}

export interface ResumeSectionOption {
  id: string
  label: string
}

