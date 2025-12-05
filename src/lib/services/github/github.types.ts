import type { GitHubContributionData } from "@/lib/db/types"

export interface ConnectGitHubParams {
  userId: string
  userEmail: string
  userName?: string | null
  token: string
}

export interface GitHubStatusResult {
  connected: boolean
  username: string | null
}

export interface ScanGitHubParams {
  userId: string
}

export interface GitHubScanResult {
  contributions: GitHubContributionData
  message: string
}

export interface GetContributionsParams {
  userId: string
}

export interface GetContributionsResult {
  contributions: GitHubContributionData
  lastScanned: Date
  scanCount: number
}

export interface ConnectGitHubResult {
  username: string
  rateLimit: {
    remaining: number
    limit: number
  }
}

export type { GitHubContributionData }
