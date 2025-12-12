import { db } from "@/lib/db"
import { achievements, users } from "@/lib/db/schema"
import type { AchievementReviewStatus } from "@/lib/db/types"
import { and, count, eq, inArray, ne, sql } from "drizzle-orm"
import type {
  AchievementStatsResult,
  BulkUpdateAchievementsParams,
  CreateAchievementParams,
  GetAchievementsParams,
  GetAchievementsResult,
  SyncAchievementsFromGitHubParams,
  UpdateAchievementReviewParams,
} from "./achievement.types"

/**
 * Parse query parameters from request URL for getAchievements
 */
export function parseGetAchievementsParams(userId: string, searchParams: URLSearchParams): GetAchievementsParams {
  const reviewStatus = searchParams.get("reviewStatus") as GetAchievementsParams["reviewStatus"] | null
  const type = searchParams.get("type") as GetAchievementsParams["type"] | null
  const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 50
  const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!, 10) : 0

  const params: GetAchievementsParams = {
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
 * Get achievements for a user with optional filters
 */
export async function getAchievements(params: GetAchievementsParams): Promise<GetAchievementsResult> {
  const { userId, reviewStatus, type, limit = 50, offset = 0 } = params

  // Build where conditions
  const conditions = [eq(achievements.userId, userId)]

  if (reviewStatus) {
    conditions.push(eq(achievements.reviewStatus, reviewStatus))
  } else {
    // Exclude archived by default when no reviewStatus is specified
    conditions.push(ne(achievements.reviewStatus, "archived"))
  }

  if (type) {
    conditions.push(eq(achievements.type, type))
  }

  // Get achievements
  const achievementsList = await db
    .select()
    .from(achievements)
    .where(and(...conditions))
    .orderBy(achievements.date)
    .limit(limit)
    .offset(offset)

  // Get total count
  const [totalResult] = await db
    .select({ count: count() })
    .from(achievements)
    .where(and(...conditions))

  return {
    achievements: achievementsList,
    total: totalResult.count,
  }
}

/**
 * Create a new achievement from GitHub contribution
 */
export async function createAchievement(params: CreateAchievementParams) {
  const { userId, type, title, description, date, repository, url, githubId, githubType } = params

  // Check if achievement already exists (avoid duplicates)
  if (githubId && githubType) {
    const [existing] = await db
      .select()
      .from(achievements)
      .where(
        and(
          eq(achievements.userId, userId),
          eq(achievements.githubId, githubId),
          eq(achievements.githubType, githubType)
        )
      )
      .limit(1)

    if (existing) {
      // Return existing achievement instead of creating duplicate
      return existing
    }
  }

  const [newAchievement] = await db
    .insert(achievements)
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

  return newAchievement
}

/**
 * Update achievement review data
 */
export async function updateAchievementReview(params: UpdateAchievementReviewParams) {
  const { achievementId, userId, relevance, resumeSectionId, techTags, customDescription } = params

  // Verify achievement belongs to user
  const [existingAchievement] = await db
    .select()
    .from(achievements)
    .where(and(eq(achievements.id, achievementId), eq(achievements.userId, userId)))
    .limit(1)

  if (!existingAchievement) {
    throw new Error("Achievement not found or access denied")
  }

  // Build update object
  const updateData: {
    relevance?: number
    resumeSectionId?: string | null
    techTags?: string[]
    customDescription?: string | null
    reviewStatus?: AchievementReviewStatus
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

  const [updatedAchievement] = await db
    .update(achievements)
    .set(updateData)
    .where(and(eq(achievements.id, achievementId), eq(achievements.userId, userId)))
    .returning()

  return updatedAchievement
}

/**
 * Archive an achievement
 */
export async function archiveAchievement(achievementId: string, userId: string) {
  // Verify achievement belongs to user
  const [existingAchievement] = await db
    .select()
    .from(achievements)
    .where(and(eq(achievements.id, achievementId), eq(achievements.userId, userId)))
    .limit(1)

  if (!existingAchievement) {
    throw new Error("Achievement not found or access denied")
  }

  const [archivedAchievement] = await db
    .update(achievements)
    .set({
      reviewStatus: "archived",
      updatedAt: new Date(),
    })
    .where(and(eq(achievements.id, achievementId), eq(achievements.userId, userId)))
    .returning()

  return archivedAchievement
}

/**
 * Unarchive an achievement (restore to reviewed status)
 */
export async function unarchiveAchievement(achievementId: string, userId: string) {
  // Verify achievement belongs to user and is archived
  const [existingAchievement] = await db
    .select()
    .from(achievements)
    .where(and(eq(achievements.id, achievementId), eq(achievements.userId, userId)))
    .limit(1)

  if (!existingAchievement) {
    throw new Error("Achievement not found or access denied")
  }

  if (existingAchievement.reviewStatus !== "archived") {
    throw new Error("Achievement is not archived")
  }

  // Restore to reviewed status (or pending if it was never reviewed)
  const [unarchivedAchievement] = await db
    .update(achievements)
    .set({
      reviewStatus: existingAchievement.reviewedAt ? "reviewed" : "pending",
      updatedAt: new Date(),
    })
    .where(and(eq(achievements.id, achievementId), eq(achievements.userId, userId)))
    .returning()

  return unarchivedAchievement
}

/**
 * Get achievement statistics for a user
 */
export async function getAchievementStats(userId: string): Promise<AchievementStatsResult> {
  const [stats] = await db
    .select({
      pending: sql<number>`COUNT(*) FILTER (WHERE ${achievements.reviewStatus} = 'pending')`,
      reviewed: sql<number>`COUNT(*) FILTER (WHERE ${achievements.reviewStatus} = 'reviewed')`,
      archived: sql<number>`COUNT(*) FILTER (WHERE ${achievements.reviewStatus} = 'archived')`,
      total: count(),
    })
    .from(achievements)
    .where(eq(achievements.userId, userId))

  return {
    pending: Number(stats.pending) || 0,
    reviewed: Number(stats.reviewed) || 0,
    archived: Number(stats.archived) || 0,
    total: stats.total,
  }
}

/**
 * Bulk update multiple achievements
 */
export async function bulkUpdateAchievements(params: BulkUpdateAchievementsParams) {
  const { userId, achievementIds, relevance, resumeSectionId, techTags, reviewStatus } = params

  if (!Array.isArray(achievementIds) || achievementIds.length === 0) {
    throw new Error("achievementIds must be a non-empty array")
  }

  // Verify all achievements belong to user
  const userAchievements = await db
    .select({ id: achievements.id })
    .from(achievements)
    .where(and(eq(achievements.userId, userId), inArray(achievements.id, achievementIds)))

  if (userAchievements.length !== achievementIds.length) {
    throw new Error("Some achievements not found or access denied")
  }

  // Build update object
  const updateData: {
    relevance?: number
    resumeSectionId?: string | null
    techTags?: string[]
    reviewStatus?: AchievementReviewStatus
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

  // Update all achievements
  await db
    .update(achievements)
    .set(updateData)
    .where(and(eq(achievements.userId, userId), inArray(achievements.id, achievementIds)))

  return {
    updated: achievementIds.length,
  }
}

/**
 * Sync achievements from GitHub contributions
 * This will be called after scanning GitHub to create pending achievements
 */
export async function syncAchievementsFromGitHub(params: SyncAchievementsFromGitHubParams) {
  const { userId } = params

  // Verify user exists
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)

  if (!user) {
    throw new Error("User not found")
  }

  // This function will be called from the GitHub scan service
  // It will receive the GitHub contribution data and create achievements
  // For now, we'll return a placeholder
  // The actual implementation will be in the GitHub service integration

  return {
    created: 0,
    skipped: 0,
  }
}

