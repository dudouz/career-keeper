import type { GitHubContributionData } from "@/lib/db/types";
import type {
  ConsolidatedReport,
  AnalysisResult,
  AnalysisContext,
} from "@/lib/agents/chain-of-density";

export interface AnalyzeContributionsWithAgentParams {
  userId: string;
  contributions?: GitHubContributionData; // Optional - will fetch from DB if not provided
  options?: {
    maxCommits?: number;
    maxPRs?: number;
    maxIssues?: number;
    maxReleases?: number;
    includeRAGContext?: boolean;
    // Period filters
    startDate?: string; // ISO date string (e.g., "2024-01-01")
    endDate?: string; // ISO date string (e.g., "2024-12-31")
    lastNDays?: number; // Alternative to startDate/endDate (e.g., 30 for last 30 days)
    // Contribution type filters
    contributionTypes?: ("pr" | "commit" | "issue" | "release")[];
    // Analysis context (NEW)
    context?: AnalysisContext; // Customize prompts based on seniority, role, objective
    // Progress callback for streaming
    onProgress?: (progress: {
      step: "step1" | "step2" | "step3" | "consolidated";
      current: number;
      total: number;
      message: string;
    }) => void;
  };
}

export interface AnalyzeContributionsWithAgentResult {
  consolidatedReport: ConsolidatedReport;
  richAnalysis: AnalysisResult;
  metadata: {
    totalContributions: number;
    processedContributions: number;
    totalDurationMs: number;
  };
}
