import { db } from "@/lib/db"
import { users, githubContributions } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import type { GitHubContributionData } from "@/lib/db/types"
import { analyzeContributionsWithAgent } from "@/lib/services/agents"
import { createSnapshot } from "@/lib/services/snapshots"

export interface AnalyzeXPParams {
  userId: string
  githubContributionId?: string
  resumeId?: string
}

export interface AnalyzeXPResult {
  snapshotId: string
  analysis: unknown
  careerData: {
    yearsOfExperience: number | null
    seniority: string | null
    focus: string | null
  }
}

/**
 * Analyze user's XP combining resume career data with GitHub contributions
 * Creates a snapshot with the analysis result
 */
export async function analyzeXP(params: AnalyzeXPParams): Promise<AnalyzeXPResult> {
  const { userId, githubContributionId, resumeId } = params

  // Get user's career data
  const [user] = await db.select().from(users).where(eq(users.id, userId))
  if (!user) {
    throw new Error("User not found")
  }

  // Get GitHub contribution if ID provided, otherwise get latest
  let contributionId = githubContributionId
  if (!contributionId) {
    const [latestContribution] = await db
      .select()
      .from(githubContributions)
      .where(eq(githubContributions.userId, userId))
      .orderBy((contributions, { desc }) => [desc(contributions.createdAt)])
      .limit(1)

    if (!latestContribution) {
      throw new Error("No GitHub contributions found. Please scan your GitHub account first.")
    }

    contributionId = latestContribution.id
  }

  // Create snapshot with GitHub analysis
  const snapshot = await createSnapshot({
    userId,
    resumeId,
    githubContributionId: contributionId,
    triggerGitHubAnalysis: true,
  })

  return {
    snapshotId: snapshot.id,
    analysis: snapshot.githubAnalysis,
    careerData: {
      yearsOfExperience: snapshot.yearsOfExperience,
      seniority: snapshot.seniority,
      focus: snapshot.focus,
    },
  }
}

