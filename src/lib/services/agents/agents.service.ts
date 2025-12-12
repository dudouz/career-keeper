import { runChainOfDensityPipeline } from "@/lib/agents/chain-of-density/pipeline";
import { getGitHubContributions } from "@/lib/services/github";
import type { GitHubContributionData } from "@/lib/db/types";
import type {
  AnalyzeContributionsWithAgentParams,
  AnalyzeContributionsWithAgentResult,
} from "./agents.types";

// Helper: Filter contributions by date period
function filterContributionsByPeriod(
  contributions: GitHubContributionData,
  options: {
    startDate?: string;
    endDate?: string;
    lastNDays?: number;
  }
): GitHubContributionData {
  const { startDate, endDate, lastNDays } = options;

  // Calculate date range
  let start: Date | null = null;
  let end: Date | null = null;

  if (lastNDays) {
    // Use lastNDays (e.g., last 30 days)
    end = new Date();
    start = new Date();
    start.setDate(start.getDate() - lastNDays);
  } else {
    // Use startDate/endDate
    if (startDate) start = new Date(startDate);
    if (endDate) end = new Date(endDate);
  }

  // If no filters, return as-is
  if (!start && !end) {
    return contributions;
  }

  // Filter commits by date
  const filteredCommits = contributions.commits.filter((commit) => {
    const commitDate = new Date(commit.date);
    if (start && commitDate < start) return false;
    if (end && commitDate > end) return false;
    return true;
  });

  // Filter PRs by date
  const filteredPRs = contributions.pullRequests.filter((pr) => {
    const prDate = new Date(pr.createdAt);
    if (start && prDate < start) return false;
    if (end && prDate > end) return false;
    return true;
  });

  // Filter issues by date
  const filteredIssues = contributions.issues.filter((issue) => {
    const issueDate = new Date(issue.createdAt);
    if (start && issueDate < start) return false;
    if (end && issueDate > end) return false;
    return true;
  });

  // Filter releases by date
  const filteredReleases = contributions.releases.filter((release) => {
    const releaseDate = new Date(release.createdAt);
    if (start && releaseDate < start) return false;
    if (end && releaseDate > end) return false;
    return true;
  });

  return {
    ...contributions,
    commits: filteredCommits,
    pullRequests: filteredPRs,
    issues: filteredIssues,
    releases: filteredReleases,
    totalContributions:
      filteredCommits.length +
      filteredPRs.length +
      filteredIssues.length +
      filteredReleases.length,
  };
}

/**
 * Analyze GitHub contributions using Chain of Density AI pipeline
 * If contributions are not provided, fetches them from the database automatically
 * Each step retrieves the OpenAI API key from the database to ensure it's always fresh
 */
export async function analyzeContributionsWithAgent(
  params: AnalyzeContributionsWithAgentParams
): Promise<AnalyzeContributionsWithAgentResult> {
  const { userId, contributions: providedContributions, options = {} } = params;

  // Get contributions - use provided ones or fetch from database
  let contributions = providedContributions;
  if (!contributions) {
    const result = await getGitHubContributions({ userId });
    contributions = result.contributions;
  }

  // Filter by period if specified
  if (options.startDate || options.endDate || options.lastNDays) {
    contributions = filterContributionsByPeriod(contributions, {
      startDate: options.startDate,
      endDate: options.endDate,
      lastNDays: options.lastNDays,
    });
  }

  // Run the Chain of Density pipeline
  // Pipeline will retrieve API key from database at each step
  const pipelineResult = await runChainOfDensityPipeline(
    contributions,
    userId,
    {
      maxCommits: options.maxCommits || 20,
      maxPRs: options.maxPRs || 10,
      maxIssues: options.maxIssues || 10,
      maxReleases: options.maxReleases || 5,
      includeRAGContext: options.includeRAGContext ?? true,
      contributionTypes: options.contributionTypes || ["pr", "commit"],
      context: options.context, // Pass custom context if provided
      onProgress: options.onProgress, // Pass progress callback for streaming
    }
  );

  if (!pipelineResult.success || !pipelineResult.consolidatedReport) {
    throw new Error(
      pipelineResult.error || "Chain of Density pipeline failed"
    );
  }

  return {
    consolidatedReport: pipelineResult.consolidatedReport,
    richAnalysis: pipelineResult.consolidatedReport.richAnalysisResult,
    metadata: {
      totalContributions: pipelineResult.metadata.totalContributions,
      processedContributions: pipelineResult.metadata.processedContributions,
      totalDurationMs: pipelineResult.metadata.totalDurationMs || 0,
    },
  };
}
