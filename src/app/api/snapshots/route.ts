import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import {
  createSnapshot,
  getSnapshotHistory,
  getActiveSnapshot,
} from "@/lib/services/snapshots"
import { scanGitHubContributions } from "@/lib/services/github"
import { db } from "@/lib/db"
import { githubContributions } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"

/**
 * GET /api/snapshots - List all snapshots for the user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get("active") === "true"

    if (activeOnly) {
      const snapshot = await getActiveSnapshot(session.user.id)
      return NextResponse.json({
        success: true,
        data: snapshot,
      })
    }

    const snapshots = await getSnapshotHistory(session.user.id)
    return NextResponse.json({
      success: true,
      data: snapshots,
    })
  } catch (error) {
    console.error("Get snapshots error:", error)
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

/**
 * POST /api/snapshots - Create a new snapshot
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { resumeId, githubContributionId, triggerGitHubAnalysis, scanGitHub, title } = body

    // If scanGitHub is true, scan GitHub first
    let contributionId = githubContributionId
    if (scanGitHub) {
      try {
        await scanGitHubContributions({ userId: session.user.id })
        // Get the latest contribution ID after scanning
        const [latestContribution] = await db
          .select({ id: githubContributions.id })
          .from(githubContributions)
          .where(eq(githubContributions.userId, session.user.id))
          .orderBy(desc(githubContributions.createdAt))
          .limit(1)

        if (latestContribution) {
          contributionId = latestContribution.id
        }
      } catch (error) {
        console.error("Failed to scan GitHub:", error)
        // Continue without GitHub data
      }
    }

    const snapshot = await createSnapshot({
      userId: session.user.id,
      resumeId,
      githubContributionId: contributionId,
      triggerGitHubAnalysis: triggerGitHubAnalysis ?? false,
      title,
    })

    return NextResponse.json({
      success: true,
      data: snapshot,
    })
  } catch (error) {
    console.error("Create snapshot error:", error)
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

