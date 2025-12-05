import { auth } from "@/auth"
import { db } from "@/lib/db"
import { brags } from "@/lib/db/schema"
import type { BragReviewStatus } from "@/lib/db/types"
import { and, eq, inArray } from "drizzle-orm"
import { NextResponse } from "next/server"

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { bragIds, relevance, resumeSectionId, techTags, reviewStatus } = body

    if (!Array.isArray(bragIds) || bragIds.length === 0) {
      return NextResponse.json({ error: "bragIds must be a non-empty array" }, { status: 400 })
    }

    // Verify all brags belong to user
    const userBrags = await db
      .select({ id: brags.id })
      .from(brags)
      .where(and(eq(brags.userId, session.user.id), inArray(brags.id, bragIds)))

    if (userBrags.length !== bragIds.length) {
      return NextResponse.json({ error: "Some brags not found or access denied" }, { status: 403 })
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
      .where(and(eq(brags.userId, session.user.id), inArray(brags.id, bragIds)))

    return NextResponse.json({ success: true, updated: bragIds.length })
  } catch (error) {
    console.error("Bulk update brags error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to update brags"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
