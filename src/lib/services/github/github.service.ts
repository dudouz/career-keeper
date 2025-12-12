import { db } from "@/lib/db"
import { githubContributions, users } from "@/lib/db/schema"
import { GitHubClient } from "@/lib/github/client"
import { decryptToken, encryptToken } from "@/lib/github/encryption"
import { createAchievement } from "@/lib/services/achievements"
import { and, eq, gte } from "drizzle-orm"
import type {
  ConnectGitHubParams,
  ConnectGitHubResult,
  GetContributionsParams,
  GetContributionsResult,
  GitHubContributionData,
  GitHubScanResult,
  GitHubStatusResult,
  ScanGitHubParams,
} from "./github.types"

/**
 * Validate and connect GitHub account by storing encrypted PAT
 */
export async function connectGitHub(params: ConnectGitHubParams): Promise<ConnectGitHubResult> {
  const { userId, userEmail, userName, token } = params

  // Validate token with GitHub
  const githubClient = new GitHubClient(token)
  const validationResult = await githubClient.validateToken()

  if (!validationResult.valid) {
    throw new Error(validationResult.error || "Invalid GitHub token")
  }

  // Encrypt token
  const encryptedToken = encryptToken(token)

  // Check if user exists in database
  const [existingUser] = await db.select().from(users).where(eq(users.id, userId))

  if (!existingUser) {
    // Create user record for OAuth users
    console.log("[GitHub Service] Creating new user record for OAuth user:", userId)
    await db.insert(users).values({
      id: userId,
      email: userEmail,
      name: userName,
      githubPat: encryptedToken,
      githubUsername: validationResult.username,
    })
  } else {
    // Update existing user with GitHub PAT
    console.log(
      "[GitHub Service] Updating user:",
      userId,
      "with username:",
      validationResult.username
    )
    await db
      .update(users)
      .set({
        githubPat: encryptedToken,
        githubUsername: validationResult.username,
      })
      .where(eq(users.id, userId))
  }

  // Check rate limit
  const rateLimit = await githubClient.checkRateLimit()

  return {
    username: validationResult.username ?? "User not provided",
    rateLimit: {
      remaining: rateLimit.remaining,
      limit: rateLimit.limit,
    },
  }
}

/**
 * Check if user has connected GitHub account
 */
export async function getGitHubStatus(userId: string): Promise<GitHubStatusResult> {
  // Check if user has GitHub PAT
  const [user] = await db
    .select({ githubPat: users.githubPat, githubUsername: users.githubUsername })
    .from(users)
    .where(eq(users.id, userId))

  return {
    connected: !!user?.githubPat,
    username: user?.githubUsername || null,
  }
}

/**
 * Scan GitHub contributions and store in database
 */
export async function scanGitHubContributions(params: ScanGitHubParams): Promise<GitHubScanResult> {
  const { userId } = params

  // Get encrypted GitHub PAT from user record
  console.log("[GitHub Service] Looking for user:", userId)
  const [user] = await db.select().from(users).where(eq(users.id, userId))

  console.log(
    "[GitHub Service] Found user:",
    user ? "YES" : "NO",
    "has PAT:",
    user?.githubPat ? "YES" : "NO"
  )

  if (!user?.githubPat) {
    throw new Error("GitHub token not found. Please connect your GitHub account first.")
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
          eq(githubContributions.userId, userId),
          gte(githubContributions.createdAt, thirtyDaysAgo)
        )
      )

    if (recentScans.length >= 4) {
      throw new Error(
        "Monthly scan limit reached (4/month for Basic tier). Upgrade to Premium for unlimited scans."
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
    .where(eq(githubContributions.userId, userId))

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
      userId,
      data: contributions,
      lastScanned: new Date(),
      scanCount: 1,
      expiresAt,
    })
  }

  // Create pending achievements from contributions
  await createAchievementsFromContributions(userId, contributions)

  return {
    contributions,
    message: "GitHub contributions scanned successfully",
  }
}

/**
 * Create pending achievements from GitHub contributions
 */
async function createAchievementsFromContributions(
  userId: string,
  contributions: GitHubContributionData
): Promise<void> {
  const createdAchievements: string[] = []

  // Create achievements from commits
  for (const commit of contributions.commits) {
    try {
      await createAchievement({
        userId,
        type: "commit",
        title: commit.message,
        description: commit.message,
        date: new Date(commit.date),
        repository: commit.repository,
        url: commit.url,
        githubId: commit.sha,
        githubType: `commit:${commit.sha}`,
      })
      createdAchievements.push(`commit:${commit.sha}`)
    } catch {
      // Skip duplicates (already handled by createAchievement)
      console.log(`[GitHub Service] Skipped duplicate commit: ${commit.sha}`)
    }
  }

  // Create achievements from pull requests
  for (const pr of contributions.pullRequests) {
    try {
      await createAchievement({
        userId,
        type: "pr",
        title: pr.title,
        date: new Date(pr.createdAt),
        repository: pr.repository,
        url: pr.url,
        githubId: pr.number.toString(),
        githubType: `pr:${pr.repository}:${pr.number}`,
      })
      createdAchievements.push(`pr:${pr.repository}:${pr.number}`)
    } catch {
      console.log(`[GitHub Service] Skipped duplicate PR: ${pr.repository}#${pr.number}`)
    }
  }

  // Create achievements from issues
  for (const issue of contributions.issues) {
    try {
      await createAchievement({
        userId,
        type: "issue",
        title: issue.title,
        date: new Date(issue.createdAt),
        repository: issue.repository,
        url: issue.url,
        githubId: issue.number.toString(),
        githubType: `issue:${issue.repository}:${issue.number}`,
      })
      createdAchievements.push(`issue:${issue.repository}:${issue.number}`)
    } catch {
      console.log(`[GitHub Service] Skipped duplicate issue: ${issue.repository}#${issue.number}`)
    }
  }

  // Create achievements from releases
  for (const release of contributions.releases) {
    try {
      await createAchievement({
        userId,
        type: "release",
        title: release.name,
        description: release.body,
        date: new Date(release.createdAt),
        repository: release.repository,
        url: release.url,
        githubId: release.tagName,
        githubType: `release:${release.repository}:${release.tagName}`,
      })
      createdAchievements.push(`release:${release.repository}:${release.tagName}`)
    } catch {
      console.log(
        `[GitHub Service] Skipped duplicate release: ${release.repository}@${release.tagName}`
      )
    }
  }

  console.log(
    `[GitHub Service] Created ${createdAchievements.length} pending achievements from contributions`
  )
}

/**
 * Get cached GitHub contributions
 */
export async function getGitHubContributions(
  params: GetContributionsParams
): Promise<GetContributionsResult> {
  const { userId } = params

  // Get cached contributions
  const [contribution] = await db
    .select()
    .from(githubContributions)
    .where(eq(githubContributions.userId, userId))

  if (!contribution) {
    throw new Error("No contributions found. Please scan your GitHub account first.")
  }

  return {
    contributions: contribution.data as GitHubContributionData,
    lastScanned: contribution.lastScanned,
    scanCount: contribution.scanCount,
  }
}
