/**
 * Centralized API queries and mutations
 * All React Query operations are defined here for consistency and reusability
 */

import type { GitHubContributionData, ResumeContent } from "@/lib/db/types"
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
      return response.json()
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
 * Reprocess a resume with the latest parser
 */
export function useReprocessResumeMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (resumeId: string) => {
      const response = await fetch("/api/resume/reprocess", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ resumeId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to reprocess resume")
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resume.list() })
      queryClient.refetchQueries({ queryKey: queryKeys.resume.list() })
    },
  })
}
