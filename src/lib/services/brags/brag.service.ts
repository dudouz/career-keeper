import { db } from "@/lib/db"
import { brags, users } from "@/lib/db/schema"
import type { BragReviewStatus } from "@/lib/db/types"
import { and, count, eq, inArray, ne, sql } from "drizzle-orm"
import type {
  BragStatsResult,
  BulkUpdateBragsParams,
  CreateBragParams,
  GetBragsParams,
  GetBragsResult,
  SyncBragsFromGitHubParams,
  UpdateBragReviewParams,
} from "./brag.types"

/**
 * Parse query parameters from request URL for getBrags
 */
export function parseGetBragsParams(userId: string, searchParams: URLSearchParams): GetBragsParams {
  const reviewStatus = searchParams.get("reviewStatus") as GetBragsParams["reviewStatus"] | null
  const type = searchParams.get("type") as GetBragsParams["type"] | null
  const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 50
  const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!, 10) : 0

  const params: GetBragsParams = {
    userId,
    limit,
    offset,
  }

  if (reviewStatus) {
    params.reviewStatus = reviewStatus
  }

  if (type) {
    params.type = type
  }

  return params
}

/**
 * Get brags for a user with optional filters
 */
export async function getBrags(params: GetBragsParams): Promise<GetBragsResult> {
  const { userId, reviewStatus, type, limit = 50, offset = 0 } = params

  // Build where conditions
  const conditions = [eq(brags.userId, userId)]

  if (reviewStatus) {
    conditions.push(eq(brags.reviewStatus, reviewStatus))
  } else {
    // Exclude archived by default when no reviewStatus is specified
    conditions.push(ne(brags.reviewStatus, "archived"))
  }

  if (type) {
    conditions.push(eq(brags.type, type))
  }

  // Get brags
  const bragsList = await db
    .select()
    .from(brags)
    .where(and(...conditions))
    .orderBy(brags.date)
    .limit(limit)
    .offset(offset)

  // Get total count
  const [totalResult] = await db
    .select({ count: count() })
    .from(brags)
    .where(and(...conditions))

  return {
    brags: bragsList,
    total: totalResult.count,
  }
}

/**
 * Create a new brag from GitHub contribution
 */
export async function createBrag(params: CreateBragParams) {
  const { userId, type, title, description, date, repository, url, githubId, githubType } = params

  // Check if brag already exists (avoid duplicates)
  if (githubId && githubType) {
    const [existing] = await db
      .select()
      .from(brags)
      .where(
        and(
          eq(brags.userId, userId),
          eq(brags.githubId, githubId),
          eq(brags.githubType, githubType)
        )
      )
      .limit(1)

    if (existing) {
      // Return existing brag instead of creating duplicate
      return existing
    }
  }

  const [newBrag] = await db
    .insert(brags)
    .values({
      userId,
      type,
      title,
      description,
      date,
      repository,
      url,
      githubId,
      githubType,
      reviewStatus: "pending",
    })
    .returning()

  return newBrag
}

/**
 * Update brag review data
 */
export async function updateBragReview(params: UpdateBragReviewParams) {
  const { bragId, userId, relevance, resumeSectionId, techTags, customDescription } = params

  // Verify brag belongs to user
  const [existingBrag] = await db
    .select()
    .from(brags)
    .where(and(eq(brags.id, bragId), eq(brags.userId, userId)))
    .limit(1)

  if (!existingBrag) {
    throw new Error("Brag not found or access denied")
  }

  // Build update object
  const updateData: {
    relevance?: number
    resumeSectionId?: string | null
    techTags?: string[]
    customDescription?: string | null
    reviewStatus?: BragReviewStatus
    reviewedAt?: Date
    updatedAt?: Date
  } = {
    updatedAt: new Date(),
  }

  if (relevance !== undefined) {
    updateData.relevance = relevance
  }

  if (resumeSectionId !== undefined) {
    updateData.resumeSectionId = resumeSectionId || null
  }

  if (techTags !== undefined) {
    updateData.techTags = techTags
  }

  if (customDescription !== undefined) {
    updateData.customDescription = customDescription || null
  }

  // If at least one review field is set, mark as reviewed
  if (
    relevance !== undefined ||
    resumeSectionId !== undefined ||
    techTags !== undefined ||
    customDescription !== undefined
  ) {
    updateData.reviewStatus = "reviewed"
    updateData.reviewedAt = new Date()
  }

  const [updatedBrag] = await db
    .update(brags)
    .set(updateData)
    .where(and(eq(brags.id, bragId), eq(brags.userId, userId)))
    .returning()

  return updatedBrag
}

/**
 * Archive a brag
 */
export async function archiveBrag(bragId: string, userId: string) {
  // Verify brag belongs to user
  const [existingBrag] = await db
    .select()
    .from(brags)
    .where(and(eq(brags.id, bragId), eq(brags.userId, userId)))
    .limit(1)

  if (!existingBrag) {
    throw new Error("Brag not found or access denied")
  }

  const [archivedBrag] = await db
    .update(brags)
    .set({
      reviewStatus: "archived",
      updatedAt: new Date(),
    })
    .where(and(eq(brags.id, bragId), eq(brags.userId, userId)))
    .returning()

  return archivedBrag
}

/**
 * Unarchive a brag (restore to reviewed status)
 */
export async function unarchiveBrag(bragId: string, userId: string) {
  // Verify brag belongs to user and is archived
  const [existingBrag] = await db
    .select()
    .from(brags)
    .where(and(eq(brags.id, bragId), eq(brags.userId, userId)))
    .limit(1)

  if (!existingBrag) {
    throw new Error("Brag not found or access denied")
  }

  if (existingBrag.reviewStatus !== "archived") {
    throw new Error("Brag is not archived")
  }

  // Restore to reviewed status (or pending if it was never reviewed)
  const [unarchivedBrag] = await db
    .update(brags)
    .set({
      reviewStatus: existingBrag.reviewedAt ? "reviewed" : "pending",
      updatedAt: new Date(),
    })
    .where(and(eq(brags.id, bragId), eq(brags.userId, userId)))
    .returning()

  return unarchivedBrag
}

/**
 * Get brag statistics for a user
 */
export async function getBragStats(userId: string): Promise<BragStatsResult> {
  const [stats] = await db
    .select({
      pending: sql<number>`COUNT(*) FILTER (WHERE ${brags.reviewStatus} = 'pending')`,
      reviewed: sql<number>`COUNT(*) FILTER (WHERE ${brags.reviewStatus} = 'reviewed')`,
      archived: sql<number>`COUNT(*) FILTER (WHERE ${brags.reviewStatus} = 'archived')`,
      total: count(),
    })
    .from(brags)
    .where(eq(brags.userId, userId))

  return {
    pending: Number(stats.pending) || 0,
    reviewed: Number(stats.reviewed) || 0,
    archived: Number(stats.archived) || 0,
    total: stats.total,
  }
}

/**
 * Bulk update multiple brags
 */
export async function bulkUpdateBrags(params: BulkUpdateBragsParams) {
  const { userId, bragIds, relevance, resumeSectionId, techTags, reviewStatus } = params

  if (!Array.isArray(bragIds) || bragIds.length === 0) {
    throw new Error("bragIds must be a non-empty array")
  }

  // Verify all brags belong to user
  const userBrags = await db
    .select({ id: brags.id })
    .from(brags)
    .where(and(eq(brags.userId, userId), inArray(brags.id, bragIds)))

  if (userBrags.length !== bragIds.length) {
    throw new Error("Some brags not found or access denied")
  }

  // Build update object
  const updateData: {
    relevance?: number
    resumeSectionId?: string | null
    techTags?: string[]
    reviewStatus?: BragReviewStatus
    reviewedAt?: Date
    updatedAt?: Date
  } = {
    updatedAt: new Date(),
  }

  if (relevance !== undefined) {
    updateData.relevance = relevance
  }

  if (resumeSectionId !== undefined) {
    updateData.resumeSectionId = resumeSectionId || null
  }

  if (techTags !== undefined) {
    updateData.techTags = techTags
  }

  if (reviewStatus !== undefined) {
    updateData.reviewStatus = reviewStatus
    if (reviewStatus === "reviewed") {
      updateData.reviewedAt = new Date()
    }
  } else if (relevance !== undefined || resumeSectionId !== undefined || techTags !== undefined) {
    // If any review field is set, mark as reviewed
    updateData.reviewStatus = "reviewed"
    updateData.reviewedAt = new Date()
  }

  // Update all brags
  await db
    .update(brags)
    .set(updateData)
    .where(and(eq(brags.userId, userId), inArray(brags.id, bragIds)))

  return {
    updated: bragIds.length,
  }
}

/**
 * Sync brags from GitHub contributions
 * This will be called after scanning GitHub to create pending brags
 */
export async function syncBragsFromGitHub(params: SyncBragsFromGitHubParams) {
  const { userId } = params

  // Verify user exists
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)

  if (!user) {
    throw new Error("User not found")
  }

  // This function will be called from the GitHub scan service
  // It will receive the GitHub contribution data and create brags
  // For now, we'll return a placeholder
  // The actual implementation will be in the GitHub service integration

  return {
    created: 0,
    skipped: 0,
  }
}
