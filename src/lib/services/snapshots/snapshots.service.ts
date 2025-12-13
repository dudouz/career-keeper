import { db } from "@/lib/db"
import { userSnapshots, users, resumes, githubContributions } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import type { GitHubContributionData } from "@/lib/db/types"
import { analyzeContributionsWithAgent } from "@/lib/services/agents"

export interface CreateSnapshotParams {
  userId: string
  resumeId?: string
  githubContributionId?: string
  triggerGitHubAnalysis?: boolean
  title?: string // Optional custom title
}

export interface SnapshotWithRelations {
  id: string
  userId: string
  resumeId: string | null
  githubContributionId: string | null
  yearsOfExperience: number | null
  seniority: string | null
  focus: string | null
  githubAnalysis: unknown | null
  createdAt: Date
  updatedAt: Date
  isActive: boolean
}

/**
 * Create a new snapshot combining resume and GitHub data
 */
export async function createSnapshot(params: CreateSnapshotParams): Promise<SnapshotWithRelations> {
  const { userId, resumeId, githubContributionId, triggerGitHubAnalysis = false, title } = params

  // Get user's career data
  const [user] = await db.select().from(users).where(eq(users.id, userId))
  if (!user) {
    throw new Error("User not found")
  }

  // Get complete resume with sections if provided
  let resumeData: unknown = null
  if (resumeId) {
    const resume = await db.query.resumes.findFirst({
      where: (resumes, { eq, and }) => and(eq(resumes.id, resumeId), eq(resumes.userId, userId)),
      with: {
        sections: {
          orderBy: (sections, { asc }) => [asc(sections.displayOrder)],
        },
      },
    })
    if (!resume) {
      throw new Error("Resume not found")
    }
    // Save complete resume data including all sections
    resumeData = {
      id: resume.id,
      userId: resume.userId,
      title: resume.title,
      name: resume.name,
      email: resume.email,
      phone: resume.phone,
      git: resume.git,
      linkedin: resume.linkedin,
      website: resume.website,
      summary: resume.summary,
      rawContent: resume.rawContent,
      fileName: resume.fileName,
      fileType: resume.fileType,
      fileUrl: resume.fileUrl,
      isActive: resume.isActive,
      createdAt: resume.createdAt,
      updatedAt: resume.updatedAt,
      sections: resume.sections.map((section) => ({
        id: section.id,
        resumeId: section.resumeId,
        startDate: section.startDate,
        endDate: section.endDate,
        position: section.position,
        company: section.company,
        description: section.description,
        displayOrder: section.displayOrder,
        createdAt: section.createdAt,
        updatedAt: section.updatedAt,
      })),
    }
  }

  // Get GitHub contribution if provided
  let githubContribution = null
  let githubContributionsData: unknown = null
  if (githubContributionId) {
    githubContribution = await db.query.githubContributions.findFirst({
      where: (githubContributions, { eq, and }) =>
        and(eq(githubContributions.id, githubContributionId), eq(githubContributions.userId, userId)),
    })
    if (!githubContribution) {
      throw new Error("GitHub contribution not found")
    }
    // Save complete GitHub contributions data
    githubContributionsData = {
      id: githubContribution.id,
      userId: githubContribution.userId,
      data: githubContribution.data,
      lastScanned: githubContribution.lastScanned,
      scanCount: githubContribution.scanCount,
      expiresAt: githubContribution.expiresAt,
      createdAt: githubContribution.createdAt,
    }
  } else {
    // Try to get latest GitHub contribution if no ID provided
    const latestContribution = await db.query.githubContributions.findFirst({
      where: (contributions, { eq }) => eq(contributions.userId, userId),
      orderBy: (contributions, { desc }) => [desc(contributions.createdAt)],
    })

    if (latestContribution) {
      githubContribution = latestContribution
      githubContributionsData = {
        id: latestContribution.id,
        userId: latestContribution.userId,
        data: latestContribution.data,
        lastScanned: latestContribution.lastScanned,
        scanCount: latestContribution.scanCount,
        expiresAt: latestContribution.expiresAt,
        createdAt: latestContribution.createdAt,
      }
    }
  }

  // If triggerGitHubAnalysis is true and we have GitHub contributions, run analysis
  let githubAnalysis: unknown | null = null
  if (triggerGitHubAnalysis && githubContribution?.data) {
    try {
      const analysisResult = await analyzeContributionsWithAgent({
        userId,
        contributions: githubContribution.data as GitHubContributionData,
        options: {
          context: {
            seniority: (user.seniority as "junior" | "mid" | "senior" | "lead") || undefined,
            role: (user.focus as "backend" | "frontend" | "fullstack" | "devops") || undefined,
            yearsOfExperience: user.yearsOfExperience || undefined,
          },
        },
      })
      // Save the full analysis result, not just consolidatedReport
      githubAnalysis = {
        consolidatedReport: analysisResult.consolidatedReport,
        metadata: analysisResult.metadata,
      }
    } catch (error) {
      console.error("[Snapshots Service] Failed to analyze GitHub contributions:", error)
      // Continue without analysis rather than failing the snapshot creation
    }
  }

  // Deactivate existing snapshots
  await db.update(userSnapshots).set({ isActive: false }).where(eq(userSnapshots.userId, userId))

  // Generate default title if not provided
  const snapshotTitle = params.title || `Snapshot ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`

  // Create new snapshot
  const [newSnapshot] = await db
    .insert(userSnapshots)
    .values({
      userId,
      resumeId: resumeId || null,
      githubContributionId: githubContribution?.id || githubContributionId || null,
      yearsOfExperience: user.yearsOfExperience,
      seniority: user.seniority,
      focus: user.focus,
      resumeData,
      githubContributionsData,
      githubAnalysis,
      title: snapshotTitle,
      isActive: true,
    })
    .returning()

  if (!newSnapshot) {
    throw new Error("Failed to create snapshot")
  }

  return newSnapshot as SnapshotWithRelations
}

/**
 * Get the active snapshot for a user
 */
export async function getActiveSnapshot(userId: string): Promise<SnapshotWithRelations | null> {
  const snapshot = await db.query.userSnapshots.findFirst({
    where: (snapshots, { eq, and }) => and(eq(snapshots.userId, userId), eq(snapshots.isActive, true)),
    with: {
      resume: true,
      githubContribution: true,
    },
  })

  return (snapshot as SnapshotWithRelations | null) || null
}

/**
 * Get a specific snapshot by ID (with ownership verification)
 */
export async function getSnapshotById(
  snapshotId: string,
  userId: string
): Promise<SnapshotWithRelations | null> {
  const snapshot = await db.query.userSnapshots.findFirst({
    where: (snapshots, { eq, and }) =>
      and(eq(snapshots.id, snapshotId), eq(snapshots.userId, userId)),
    with: {
      resume: true,
      githubContribution: true,
    },
  })

  return (snapshot as SnapshotWithRelations | null) || null
}

/**
 * Get snapshot history for a user
 */
export async function getSnapshotHistory(userId: string): Promise<SnapshotWithRelations[]> {
  const snapshots = await db.query.userSnapshots.findMany({
    where: (snapshots, { eq, and }) => and(eq(snapshots.userId, userId), eq(snapshots.isActive, true)),
    orderBy: (snapshots, { desc }) => [desc(snapshots.createdAt)],
    with: {
      resume: true,
      githubContribution: true,
    },
  })

  return snapshots as SnapshotWithRelations[]
}

/**
 * Get a specific snapshot by ID
 */
export async function getSnapshot(snapshotId: string, userId: string): Promise<SnapshotWithRelations | null> {
  const snapshot = await db.query.userSnapshots.findFirst({
    where: (snapshots, { eq, and }) => and(eq(snapshots.id, snapshotId), eq(snapshots.userId, userId)),
    with: {
      resume: true,
      githubContribution: true,
    },
  })

  return (snapshot as SnapshotWithRelations | null) || null
}

/**
 * Update a snapshot
 */
export async function updateSnapshot(
  snapshotId: string,
  userId: string,
  updates: {
    githubAnalysis?: unknown
    isActive?: boolean
    title?: string
  }
): Promise<SnapshotWithRelations> {
  const [updatedSnapshot] = await db
    .update(userSnapshots)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(and(eq(userSnapshots.id, snapshotId), eq(userSnapshots.userId, userId)))
    .returning()

  if (!updatedSnapshot) {
    throw new Error("Snapshot not found")
  }

  return updatedSnapshot as SnapshotWithRelations
}

/**
 * Generate GitHub analysis for a snapshot and update it
 */
export async function generateSnapshotAnalysis(
  snapshotId: string,
  userId: string
): Promise<SnapshotWithRelations> {
  // Get snapshot
  const snapshot = await db.query.userSnapshots.findFirst({
    where: (snapshots, { eq, and }) => and(eq(snapshots.id, snapshotId), eq(snapshots.userId, userId)),
  })

  if (!snapshot) {
    throw new Error("Snapshot not found")
  }

  // Get user's career data
  const [user] = await db.select().from(users).where(eq(users.id, userId))
  if (!user) {
    throw new Error("User not found")
  }

  // Get GitHub contributions data from snapshot
  const githubContributionsDataWrapper = snapshot.githubContributionsData as {
    data?: GitHubContributionData
  } | null

  if (!githubContributionsDataWrapper?.data) {
    throw new Error("No GitHub contributions data found in snapshot")
  }

  // Generate analysis
  const analysisResult = await analyzeContributionsWithAgent({
    userId,
    contributions: githubContributionsDataWrapper.data,
    options: {
      context: {
        seniority: (user.seniority as "junior" | "mid" | "senior" | "lead") || undefined,
        role: (user.focus as "backend" | "frontend" | "fullstack" | "devops") || undefined,
        yearsOfExperience: user.yearsOfExperience || undefined,
      },
    },
  })

  // Update snapshot with analysis (save full result including metadata)
  return updateSnapshot(snapshotId, userId, {
    githubAnalysis: {
      consolidatedReport: analysisResult.consolidatedReport,
      metadata: analysisResult.metadata,
    },
  })
}

/**
 * Deactivate a snapshot
 */
export async function deactivateSnapshot(snapshotId: string, userId: string): Promise<void> {
  console.log("[Snapshots Service] Deactivating snapshot:", snapshotId, "for user:", userId)
  
  if (!snapshotId || !userId) {
    throw new Error("Snapshot ID and User ID are required")
  }
  
  const result = await db
    .update(userSnapshots)
    .set({ isActive: false, updatedAt: new Date() })
    .where(and(eq(userSnapshots.id, snapshotId), eq(userSnapshots.userId, userId)))
    .returning({ id: userSnapshots.id })
  
  console.log("[Snapshots Service] Deactivation result:", result)
  
  if (result.length === 0) {
    throw new Error("Snapshot not found or you don't have permission to delete it")
  }
}

