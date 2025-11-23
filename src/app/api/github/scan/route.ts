import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { GitHubClient } from "@/lib/github/client"
import { decryptToken } from "@/lib/github/encryption"
import { db } from "@/lib/db"
import { githubContributions, users } from "@/lib/db/schema"
import { eq, and, gte } from "drizzle-orm"

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get encrypted GitHub PAT from user record
    console.log("[GitHub Scan] Looking for user:", session.user.id)
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))

    console.log("[GitHub Scan] Found user:", user ? "YES" : "NO", "has PAT:", user?.githubPat ? "YES" : "NO")

    if (!user?.githubPat) {
      return NextResponse.json(
        { error: "GitHub token not found. Please connect your GitHub account first." },
        { status: 400 }
      )
    }

    // Check scan limits for basic tier
    if (user.subscriptionTier === "basic") {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const recentScans = await db
        .select()
        .from(githubContributions)
        .where(
          and(
            eq(githubContributions.userId, session.user.id),
            gte(githubContributions.createdAt, thirtyDaysAgo)
          )
        )

      if (recentScans.length >= 4) {
        return NextResponse.json(
          { error: "Monthly scan limit reached (4/month for Basic tier). Upgrade to Premium for unlimited scans." },
          { status: 429 }
        )
      }
    }

    // Decrypt token and create GitHub client
    const token = decryptToken(user.githubPat)
    const githubClient = new GitHubClient(token)

    // Fetch contributions
    const contributions = await githubClient.fetchContributions()

    // Store in database
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30) // Cache for 30 days

    const [existingContribution] = await db
      .select()
      .from(githubContributions)
      .where(eq(githubContributions.userId, session.user.id))

    if (existingContribution) {
      // Update existing
      await db
        .update(githubContributions)
        .set({
          data: contributions,
          lastScanned: new Date(),
          scanCount: existingContribution.scanCount + 1,
          expiresAt,
        })
        .where(eq(githubContributions.id, existingContribution.id))
    } else {
      // Create new
      await db.insert(githubContributions).values({
        userId: session.user.id,
        data: contributions,
        lastScanned: new Date(),
        scanCount: 1,
        expiresAt,
      })
    }

    return NextResponse.json({
      success: true,
      contributions,
      message: "GitHub contributions scanned successfully",
    })
  } catch (error) {
    console.error("GitHub scan error:", error)
    return NextResponse.json({ error: "Failed to scan GitHub contributions" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get cached contributions
    const [contribution] = await db
      .select()
      .from(githubContributions)
      .where(eq(githubContributions.userId, session.user.id))

    if (!contribution) {
      return NextResponse.json(
        { error: "No contributions found. Please scan your GitHub account first." },
        { status: 404 }
      )
    }

    return NextResponse.json({
      contributions: contribution.data,
      lastScanned: contribution.lastScanned,
      scanCount: contribution.scanCount,
    })
  } catch (error) {
    console.error("Get contributions error:", error)
    return NextResponse.json({ error: "Failed to get contributions" }, { status: 500 })
  }
}

