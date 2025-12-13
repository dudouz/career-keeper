/**
 * Centralized API queries and mutations
 * All React Query operations are defined here for consistency and reusability
 */

import { PAGINATION } from "@/lib/constants"
import type {
  AchievementReviewStatus,
  AchievementType,
  GitHubContributionData,
  Resume,
  ResumeContent,
} from "@/lib/db/types"
import { checkGitHubRateLimit, validateGitHubToken } from "@/lib/github/service"
import {
  useMutation,
  UseMutationOptions,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query"

// =============================================================================
// QUERY KEYS
// =============================================================================

export const queryKeys = {
  // GitHub
  github: {
    all: ["github"] as const,
    status: () => [...queryKeys.github.all, "status"] as const,
    contributions: () => [...queryKeys.github.all, "contributions"] as const,
    rateLimit: (token: string) => [...queryKeys.github.all, "rateLimit", token] as const,
  },
  // LLM
  llm: {
    all: ["llm"] as const,
    analyze: () => [...queryKeys.llm.all, "analyze"] as const,
    summarize: () => [...queryKeys.llm.all, "summarize"] as const,
    compare: () => [...queryKeys.llm.all, "compare"] as const,
  },
  // Agents
  agents: {
    all: ["agents"] as const,
    analyzeContributions: () => [...queryKeys.agents.all, "analyzeContributions"] as const,
  },
  // OpenAI
  openai: {
    all: ["openai"] as const,
    keyStatus: () => [...queryKeys.openai.all, "keyStatus"] as const,
  },
  // Resume
  resume: {
    all: ["resume"] as const,
    list: () => [...queryKeys.resume.all, "list"] as const,
    detail: (id: string) => [...queryKeys.resume.all, "detail", id] as const,
  },
  // Achievements
  achievements: {
    all: ["achievements"] as const,
    stats: () => [...queryKeys.achievements.all, "stats"] as const,
    list: (filters?: { reviewStatus?: string; type?: string; page?: number; pageSize?: number }) =>
      [...queryKeys.achievements.all, "list", filters] as const,
  },
  // Snapshots
  snapshots: {
    all: ["snapshots"] as const,
    list: () => [...queryKeys.snapshots.all, "list"] as const,
    active: () => [...queryKeys.snapshots.all, "active"] as const,
    detail: (id: string) => [...queryKeys.snapshots.all, "detail", id] as const,
  },
  // Projects
  projects: {
    all: ["projects"] as const,
    list: () => [...queryKeys.projects.all, "list"] as const,
    detail: (id: string) => [...queryKeys.projects.all, "detail", id] as const,
  },
} as const

// =============================================================================
// GITHUB QUERIES
// =============================================================================

/**
 * Fetch GitHub connection status
 */
export function useGitHubStatusQuery(
  options?: Omit<UseQueryOptions<{ connected: boolean; username?: string }>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.github.status(),
    queryFn: async () => {
      const response = await fetch("/api/github/status")
      if (!response.ok) {
        throw new Error("Failed to fetch GitHub status")
      }
      return response.json() as Promise<{ connected: boolean; username?: string }>
    },
    ...options,
  })
}

/**
 * Fetch GitHub contributions (cached from database)
 * By default, this query is disabled to prevent automatic fetching.
 * Pass `enabled: true` in options to enable automatic fetching.
 */
export function useGitHubContributionsQuery(
  options?: Omit<
    UseQueryOptions<{
      contributions: GitHubContributionData
      lastScanned?: Date
      scanCount?: number
    }>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: queryKeys.github.contributions(),
    queryFn: async () => {
      const response = await fetch("/api/github/scan", {
        method: "GET",
      })
      if (!response.ok) {
        if (response.status === 404) {
          // No contributions found - return empty data instead of throwing
          return {
            contributions: {
              commits: [],
              pullRequests: [],
              issues: [],
              releases: [],
              repositories: [],
              languages: {},
            },
          }
        }
        throw new Error("Failed to fetch contributions")
      }
      return response.json()
    },
    enabled: false, // Opt-in: must explicitly enable to fetch
    ...options,
  })
}

/**
 * Check GitHub API rate limit
 */
export function useGitHubRateLimitQuery(token: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.github.rateLimit(token),
    queryFn: () => checkGitHubRateLimit(token),
    enabled: enabled && !!token,
    refetchInterval: 60000, // Refetch every minute
  })
}

// =============================================================================
// GITHUB MUTATIONS
// =============================================================================

/**
 * Validate GitHub token
 */
export function useValidateGitHubTokenMutation(
  options?: UseMutationOptions<{ valid: boolean; username?: string; error?: string }, Error, string>
) {
  return useMutation({
    mutationFn: (token: string) => validateGitHubToken(token),
    ...options,
  })
}

/**
 * Connect GitHub account
 */
export function useConnectGitHubMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (token: string) => {
      const response = await fetch("/api/github/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to connect GitHub")
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.github.status() })
    },
  })
}

/**
 * Scan GitHub contributions
 */
export function useScanGitHubContributionsMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/github/scan", {
        method: "POST",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to scan contributions")
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.github.contributions() })
    },
  })
}

// =============================================================================
// OPENAI QUERIES
// =============================================================================

/**
 * Check if OpenAI API key is configured
 */
export function useOpenAIKeyStatusQuery(
  options?: Omit<UseQueryOptions<{ hasKey: boolean }>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.openai.keyStatus(),
    queryFn: async () => {
      const response = await fetch("/api/openai/key")
      if (!response.ok) {
        throw new Error("Failed to check OpenAI key status")
      }
      return response.json() as Promise<{ hasKey: boolean }>
    },
    ...options,
  })
}

// =============================================================================
// LLM QUERIES
// =============================================================================

// LLM operations are typically mutations as they involve processing/generation
// But we can cache results for performance

// =============================================================================
// LLM MUTATIONS
// =============================================================================

/**
 * Analyze GitHub contributions with AI
 */
export function useAnalyzeContributionsMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (contributions: GitHubContributionData) => {
      const response = await fetch("/api/llm/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contributions }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to analyze contributions")
      }

      return response.json() as Promise<{
        achievements: string[]
        skills: string[]
        projects: Array<{ name: string; description: string; highlights: string[] }>
      }>
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.llm.analyze(), data)
    },
  })
}

/**
 * Generate resume summary with AI
 */
export function useGenerateSummaryMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      contributions: GitHubContributionData
      currentSummary?: string
      tone?: "technical" | "leadership" | "hybrid"
    }) => {
      const response = await fetch("/api/llm/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to generate summary")
      }
      const data = await response.json()

      // TODO: Fix this type properly
      return data.data as {
        summary: string
        alternatives: string[]
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.llm.summarize(), data)
    },
  })
}

/**
 * Compare resume with GitHub contributions
 */
export function useCompareResumeWithContributionsMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      existingResume: string
      contributions: GitHubContributionData
    }) => {
      const response = await fetch("/api/llm/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to compare resume")
      }

      const data = await response.json()

      return data.data as {
        missingAchievements: string[]
        outdatedSections: string[]
        suggestions: string[]
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.llm.compare(), data)
    },
  })
}

/**
 * Save OpenAI API key
 */
export function useSaveOpenAIKeyMutation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (apiKey: string) => {
      const response = await fetch("/api/openai/key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to save API key")
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate the OpenAI key status query to refresh the UI
      queryClient.invalidateQueries({ queryKey: queryKeys.openai.keyStatus() })
    },
  })
}

// =============================================================================
// RESUME QUERIES
// =============================================================================

/**
 * Fetch all resumes
 */
export function useResumesQuery() {
  return useQuery({
    queryKey: queryKeys.resume.list(),
    queryFn: async () => {
      const response = await fetch("/api/resume/upload")
      if (!response.ok) {
        throw new Error("Failed to fetch resumes")
      }
      return response.json() as Promise<{
        resumes: Resume[]
      }>
    },
  })
}

// =============================================================================
// RESUME MUTATIONS
// =============================================================================

/**
 * Upload a resume
 */
export function useUploadResumeMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/resume/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to upload resume")
      }

      const result = await response.json()
      // Ensure resumeId is available for convenience
      return {
        ...result,
        resumeId: result.resume?.id,
      } as {
        success: boolean
        resumeId?: string
        resume: {
          id: string
          title: string
          fileName: string
          fileType: string
          content: ResumeContent
        }
        message: string
      }
    },
    onSuccess: () => {
      // Immediately refetch to update the UI
      queryClient.invalidateQueries({ queryKey: queryKeys.resume.list() })
      queryClient.refetchQueries({ queryKey: queryKeys.resume.list() })
    },
  })
}

/**
 * Delete a resume
 */
export function useDeleteResumeMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (resumeId: string) => {
      const response = await fetch(`/api/resume/${resumeId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete resume")
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resume.list() })
    },
  })
}

/**
 * Re-extract resume data using LLM and update database
 */
export function useReprocessResumeMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (resumeId: string) => {
      const response = await fetch("/api/resume/parse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ resumeId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to re-extract resume data")
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resume.list() })
      queryClient.refetchQueries({ queryKey: queryKeys.resume.list() })
    },
  })
}

// =============================================================================
// ACHIEVEMENTS QUERIES
// =============================================================================

/**
 * Fetch achievements with optional filters and pagination
 */
export function useAchievementsQuery(
  options?: Omit<
    UseQueryOptions<{
      achievements: Array<{
        id: string
        type: AchievementType
        title: string
        description?: string | null
        date: Date
        repository: string
        url: string
        reviewStatus: AchievementReviewStatus
        relevance?: number | null
        resumeSectionId?: string | null
        techTags?: string[] | null
        customDescription?: string | null
        createdAt: Date
        updatedAt: Date
        reviewedAt?: Date | null
      }>
      total: number
    }>,
    "queryKey" | "queryFn"
  > & {
    reviewStatus?: AchievementReviewStatus
    type?: AchievementType
    page?: number
    pageSize?: number
  }
) {
  const {
    reviewStatus,
    type,
    page = PAGINATION.DEFAULT_PAGE,
    pageSize = PAGINATION.DEFAULT_PAGE_SIZE,
    ...queryOptions
  } = options || {}

  return useQuery({
    queryKey: queryKeys.achievements.list({ reviewStatus, type, page, pageSize }),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (reviewStatus) params.append("reviewStatus", reviewStatus)
      if (type) params.append("type", type)
      if (queryOptions?.enabled !== false) {
        params.append("limit", String(pageSize))
        params.append("offset", String((page - 1) * pageSize))
      }

      const response = await fetch(`/api/achievements?${params.toString()}`)
      if (!response.ok) {
        throw new Error("Failed to fetch achievements")
      }
      return response.json()
    },
    ...queryOptions,
  })
}

/**
 * Fetch achievement statistics
 */
export function useAchievementStatsQuery(
  options?: Omit<
    UseQueryOptions<{ pending: number; reviewed: number; archived: number; total: number }>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: queryKeys.achievements.stats(),
    queryFn: async () => {
      const response = await fetch("/api/achievements/stats")
      if (!response.ok) {
        throw new Error("Failed to fetch achievement stats")
      }
      return response.json()
    },
    ...options,
  })
}

// =============================================================================
// ACHIEVEMENTS MUTATIONS
// =============================================================================

/**
 * Update achievement review
 */
export function useUpdateAchievementReviewMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      achievementId: string
      relevance?: number
      resumeSectionId?: string | null
      techTags?: string[]
      customDescription?: string | null
    }) => {
      const response = await fetch(`/api/achievements/${params.achievementId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          relevance: params.relevance,
          resumeSectionId: params.resumeSectionId,
          techTags: params.techTags,
          customDescription: params.customDescription,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update achievement review")
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.achievements.all })
    },
  })
}

/**
 * Archive a achievement
 */
export function useArchiveAchievementMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (achievementId: string) => {
      const response = await fetch(`/api/achievements/${achievementId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to archive achievement")
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.achievements.all })
    },
  })
}

/**
 * Unarchive a achievement
 */
export function useUnarchiveAchievementMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (achievementId: string) => {
      const response = await fetch(`/api/achievements/${achievementId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unarchive: true }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to unarchive achievement")
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.achievements.all })
    },
  })
}

/**
 * Bulk update achievements
 */
export function useBulkUpdateAchievementsMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      achievementIds: string[]
      relevance?: number
      resumeSectionId?: string | null
      techTags?: string[]
      reviewStatus?: "pending" | "reviewed" | "archived"
    }) => {
      const response = await fetch("/api/achievements/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update achievements")
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.achievements.all })
    },
  })
}

// =============================================================================
// AGENTS MUTATIONS
// =============================================================================

/**
 * Analyze GitHub contributions using Chain of Density AI pipeline
 */
export function useAnalyzeContributionsWithAgentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (options?: {
      contributions?: GitHubContributionData
      maxCommits?: number
      maxPRs?: number
      includeRAGContext?: boolean
      startDate?: string
      endDate?: string
      lastNDays?: number
      context?: {
        seniority?: "junior" | "mid" | "senior" | "staff" | "principal" | "lead"
        role?: "backend" | "frontend" | "fullstack" | "devops" | "mobile" | "data" | "ml" | "security"
        objective?: "job_application" | "promotion" | "year_review" | "portfolio" | "general" | "linkedin" | "resume_update" | "salary_negotiation"
        targetJobTitle?: string
        targetCompany?: string
        yearsOfExperience?: number
        customInstructions?: string
      }
    }) => {
      const response = await fetch("/api/agents/analyze-contributions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(options?.contributions ? { contributions: options.contributions } : {}),
          options: {
            maxCommits: options?.maxCommits,
            maxPRs: options?.maxPRs,
            includeRAGContext: options?.includeRAGContext,
            startDate: options?.startDate,
            endDate: options?.endDate,
            lastNDays: options?.lastNDays,
            context: options?.context,
          },
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to analyze contributions")
      }

      return response.json() as Promise<{
        success: boolean
        data: {
          consolidatedReport: {
            overallSummary: string
            individualReports: Array<{
              markdownReport: string
              contributionMetadata: {
                type: "pr" | "commit"
                identifier: string
                title?: string
                author?: string
                date?: string
              }
            }>
            aggregatedInsights: {
              totalContributions: number
              topTechnologies: Array<{ name: string; count: number }>
              topPatterns: Array<{ name: string; count: number }>
              keyAchievements: string[]
            }
            richAnalysisResult: {
              prAnalyses: Array<{
                prNumber: number
                title: string
                summary: string
                technologies: string[]
                patterns: string[]
                complexity: "low" | "medium" | "high"
                impact: string
                filesChanged?: number
                additions?: number
                deletions?: number
              }>
              commitAnalyses: Array<{
                sha: string
                message: string
                summary: string
                technologies: string[]
                patterns: string[]
                filesChanged: number
                impact: string
                additions?: number
                deletions?: number
              }>
              keyTechnologies: string[]
              keyPatterns: string[]
              recommendations: string[]
            }
          }
          richAnalysis: unknown
        }
        metadata: {
          totalContributions: number
          processedContributions: number
          totalDurationMs: number
          remaining?: number
        }
      }>
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.agents.analyzeContributions(), data)
    },
  })
}

// =============================================================================
// SNAPSHOTS QUERIES & MUTATIONS
// =============================================================================

/**
 * Fetch active snapshot for user
 */
export function useActiveSnapshotQuery(
  options?: Omit<UseQueryOptions<{ success: boolean; data: unknown }>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.snapshots.active(),
    queryFn: async () => {
      const response = await fetch("/api/snapshots?active=true")
      if (!response.ok) {
        throw new Error("Failed to fetch active snapshot")
      }
      return response.json() as Promise<{ success: boolean; data: unknown }>
    },
    ...options,
  })
}

/**
 * Fetch snapshot history for user
 */
export function useSnapshotsQuery(
  options?: Omit<UseQueryOptions<{ success: boolean; data: unknown[] }>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.snapshots.list(),
    queryFn: async () => {
      const response = await fetch("/api/snapshots")
      if (!response.ok) {
        throw new Error("Failed to fetch snapshots")
      }
      return response.json() as Promise<{ success: boolean; data: unknown[] }>
    },
    ...options,
  })
}

export function useSnapshotByIdQuery(
  snapshotId: string,
  options?: Omit<UseQueryOptions<{ success: boolean; data: unknown }>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.snapshots.detail(snapshotId),
    queryFn: async () => {
      const response = await fetch(`/api/snapshots/${snapshotId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch snapshot")
      }
      return response.json() as Promise<{ success: boolean; data: unknown }>
    },
    enabled: !!snapshotId,
    ...options,
  })
}

/**
 * Generate GitHub analysis for a snapshot
 */
export function useGenerateSnapshotAnalysisMutation(
  options?: UseMutationOptions<
    { success: boolean; data: unknown },
    Error,
    { snapshotId: string }
  >
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ snapshotId }) => {
      const response = await fetch(`/api/snapshots/${snapshotId}/analyze`, {
        method: "POST",
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to generate snapshot analysis")
      }
      return response.json() as Promise<{ success: boolean; data: unknown }>
    },
    onSuccess: (data, variables, context) => {
      // Invalidate all snapshot queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: queryKeys.snapshots.all })
      // Call custom onSuccess if provided
      if (options?.onSuccess) {
        options.onSuccess(data, variables, context)
      }
    },
    ...options,
  })
}

/**
 * Update a snapshot
 */
export function useUpdateSnapshotMutation(
  options?: UseMutationOptions<
    { success: boolean; data: unknown },
    Error,
    { snapshotId: string; title?: string; githubAnalysis?: unknown; isActive?: boolean }
  >
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ snapshotId, ...updates }) => {
      const response = await fetch(`/api/snapshots/${snapshotId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update snapshot")
      }
      return response.json() as Promise<{ success: boolean; data: unknown }>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.snapshots.all })
    },
    ...options,
  })
}

// =============================================================================
// PROJECTS QUERIES & MUTATIONS
// =============================================================================

export function useProjectsQuery(
  options?: Omit<UseQueryOptions<{ success: boolean; data: unknown[] }>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.projects.list(),
    queryFn: async () => {
      const response = await fetch("/api/projects")
      if (!response.ok) {
        throw new Error("Failed to fetch projects")
      }
      return response.json() as Promise<{ success: boolean; data: unknown[] }>
    },
    ...options,
  })
}

export function useProjectQuery(
  projectId: string,
  options?: Omit<UseQueryOptions<{ success: boolean; data: unknown }>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.projects.detail(projectId),
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch project")
      }
      return response.json() as Promise<{ success: boolean; data: unknown }>
    },
    enabled: !!projectId,
    ...options,
  })
}

export function useCreateProjectMutation(
  options?: UseMutationOptions<
    { success: boolean; data: unknown },
    Error,
    { repository?: unknown; repositories?: unknown[]; projectName?: string; notes?: string; projectNames?: Record<string, string> }
  >
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ repository, repositories, projectName, notes, projectNames }) => {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repository, repositories, projectName, notes, projectNames }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create project")
      }
      return response.json() as Promise<{ success: boolean; data: unknown }>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all })
    },
    ...options,
  })
}

export function useUpdateProjectMutation(
  options?: UseMutationOptions<
    { success: boolean; data: unknown },
    Error,
    { projectId: string; projectName?: string; notes?: string }
  >
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ projectId, projectName, notes }) => {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectName, notes }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update project")
      }
      return response.json() as Promise<{ success: boolean; data: unknown }>
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(variables.projectId) })
    },
    ...options,
  })
}

export function useDeleteProjectMutation(
  options?: UseMutationOptions<
    { success: boolean; message: string },
    Error,
    { projectId: string }
  >
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ projectId }) => {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete project")
      }
      return response.json() as Promise<{ success: boolean; message: string }>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all })
    },
    ...options,
  })
}

/**
 * Deactivate/delete a snapshot
 */
export function useDeactivateSnapshotMutation(
  options?: UseMutationOptions<
    { success: boolean; message: string },
    Error,
    { snapshotId: string }
  >
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ snapshotId }) => {
      console.log("[useDeactivateSnapshotMutation] Deleting snapshot:", snapshotId)
      const response = await fetch(`/api/snapshots/${snapshotId}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        const error = await response.json()
        console.error("[useDeactivateSnapshotMutation] Error response:", error)
        throw new Error(error.error || "Failed to deactivate snapshot")
      }
      const result = await response.json()
      console.log("[useDeactivateSnapshotMutation] Success:", result)
      return result as Promise<{ success: boolean; message: string }>
    },
    onSuccess: (data, variables, context) => {
      console.log("[useDeactivateSnapshotMutation] Invalidating queries...")
      queryClient.invalidateQueries({ queryKey: queryKeys.snapshots.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.snapshots.list() })
      queryClient.invalidateQueries({ queryKey: queryKeys.snapshots.active() })
      // Call custom onSuccess if provided
      if (options?.onSuccess) {
        options.onSuccess(data, variables, context)
      }
    },
    ...options,
  })
}

/**
 * Create a new snapshot
 */
export function useCreateSnapshotMutation(
  options?: UseMutationOptions<
    { success: boolean; data: unknown },
    Error,
    { resumeId?: string; githubContributionId?: string; triggerGitHubAnalysis?: boolean; scanGitHub?: boolean }
  >
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      resumeId?: string
      githubContributionId?: string
      triggerGitHubAnalysis?: boolean
      scanGitHub?: boolean
    }) => {
      const response = await fetch("/api/snapshots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create snapshot")
      }

      return response.json() as Promise<{ success: boolean; data: unknown }>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.snapshots.all })
    },
    ...options,
  })
}

