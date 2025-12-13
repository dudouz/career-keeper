export interface SnapshotWithRelations {
  id: string
  userId: string
  resumeId: string | null
  githubContributionId: string | null
  yearsOfExperience: number | null
  seniority: string | null
  focus: string | null
  resumeData: unknown | null // Complete resume data with all sections
  githubContributionsData: unknown | null // Complete GitHub contributions data
  githubAnalysis: unknown | null // Result from agent analysis
  title: string | null // User-defined title
  createdAt: Date
  updatedAt: Date
  isActive: boolean
}

export interface CreateSnapshotParams {
  userId: string
  resumeId?: string
  githubContributionId?: string
  triggerGitHubAnalysis?: boolean
}
