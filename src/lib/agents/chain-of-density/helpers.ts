import type { GitHubContributionData, Commit, PullRequest } from "@/lib/db/types";
import type {
  ContributionItem,
  PRAnalysis,
  CommitAnalysis,
  Step1Output,
  Step2Output,
  AnalysisResult,
} from "./types";

/**
 * Converts a GitHub commit to a ContributionItem for processing
 */
interface CommitFile {
  filename: string;
  additions: number;
  deletions: number;
  patch?: string;
}

interface ExtendedCommit extends Commit {
  files?: CommitFile[];
  stats?: {
    additions: number;
    deletions: number;
  };
  author: {
    name: string;
    email: string;
    date: string;
  };
}

export function commitToContributionItem(commit: ExtendedCommit): ContributionItem {
  // Build commit message
  const commitMessages = commit.message;

  // Build raw diff from files
  let rawDiff = "";
  if (commit.files && commit.files.length > 0) {
    rawDiff = commit.files
      .map((file: CommitFile) => {
        const header = `diff --git a/${file.filename} b/${file.filename}
--- a/${file.filename}
+++ b/${file.filename}
@@ -0,0 +${file.additions} +${file.deletions},0 @@`;

        const patch = file.patch || `Changes: +${file.additions} -${file.deletions}`;

        return `${header}\n${patch}`;
      })
      .join("\n\n");
  } else {
    rawDiff = `No diff available. Stats: ${commit.stats?.additions || 0} additions, ${commit.stats?.deletions || 0} deletions`;
  }

  return {
    type: "commit",
    commitMessages,
    rawDiff,
    metadata: {
      sha: commit.sha,
      author: commit.author?.name || "Unknown",
      date: commit.author?.date || new Date().toISOString(),
    },
  };
}

interface ExtendedPullRequest extends PullRequest {
  body?: string;
  changed_files?: number;
  additions?: number;
  deletions?: number;
  user?: {
    login: string;
  };
  created_at: string;
}

/**
 * Converts a GitHub PR to a ContributionItem for processing
 */
export function prToContributionItem(pr: ExtendedPullRequest): ContributionItem {
  // Build commit message from PR
  const commitMessages = `PR #${pr.number}: ${pr.title}

${pr.body || "No description provided"}`;

  // For PRs, we'd ideally fetch the full diff from GitHub API
  // For now, we'll use a placeholder that indicates we need the diff
  const rawDiff = `Pull Request Diff
Files changed: ${pr.changed_files || "unknown"}
Additions: ${pr.additions || 0}
Deletions: ${pr.deletions || 0}

Note: Full diff should be fetched from GitHub API endpoint:
GET /repos/{owner}/{repo}/pulls/${pr.number}/files`;

  return {
    type: "pr",
    commitMessages,
    rawDiff,
    metadata: {
      prNumber: pr.number,
      title: pr.title,
      author: pr.user?.login,
      date: pr.created_at,
    },
  };
}

/**
 * Converts GitHub contributions to ContributionItems for processing
 */
export function githubContributionsToItems(
  contributions: GitHubContributionData,
  options: {
    maxCommits?: number;
    maxPRs?: number;
    maxIssues?: number;
    maxReleases?: number;
    contributionTypes?: ("pr" | "commit" | "issue" | "release")[];
  } = {}
): ContributionItem[] {
  const {
    maxCommits = 20,
    maxPRs = 10,
    maxIssues = 10,
    maxReleases = 5,
    contributionTypes = ["pr", "commit"], // Default to PRs and commits
  } = options;

  const items: ContributionItem[] = [];

  // Process PRs if included
  if (contributionTypes.includes("pr")) {
    const prs = contributions.pullRequests || [];
    const prItems = prs.slice(0, maxPRs).map((pr) => prToContributionItem(pr as ExtendedPullRequest));
    items.push(...prItems);
  }

  // Process commits if included
  if (contributionTypes.includes("commit")) {
    const commits = contributions.commits || [];
    const commitItems = commits.slice(0, maxCommits).map((commit) => commitToContributionItem(commit as ExtendedCommit));
    items.push(...commitItems);
  }

  // Note: Issues and releases would need to be converted to ContributionItem format
  // For now, we'll focus on PRs and commits as they're the most valuable

  return items;
}

interface ExtendedRepository {
  name: string;
  languages?: Record<string, number>;
}

/**
 * Generates RAG context from GitHub contributions
 * This would ideally be enhanced with actual RAG/vector search
 */
export function generateRAGContext(contributions: GitHubContributionData): string {
  const repos = (contributions.repositories || []) as ExtendedRepository[];
  const languages = repos.flatMap((repo: ExtendedRepository) => Object.keys(repo.languages || {}));
  const uniqueLanguages = [...new Set(languages)];

  const repoNames = repos.map((repo: ExtendedRepository) => repo.name);

  return `# Project Context

## Repositories
${repoNames.join(", ")}

## Primary Languages
${uniqueLanguages.join(", ")}

## Project Structure
Based on the repositories, this appears to be a ${uniqueLanguages.length > 0 ? uniqueLanguages[0] : "software"} project with contributions across ${repos.length} repositories.

## Common Patterns
- Modern web development practices
- Version control with Git/GitHub
- Collaborative development with PRs and code reviews

This context can be used to better understand references to internal modules, frameworks, and architectural decisions in the code changes.`;
}

/**
 * Transforms Step 1 + Step 2 outputs into a rich PRAnalysis
 */
export function createPRAnalysis(
  step1: Step1Output,
  step2: Step2Output,
  item: ContributionItem
): PRAnalysis {
  if (item.type !== "pr") {
    throw new Error("Item must be a PR to create PRAnalysis");
  }

  // Extract complexity from step2 or infer from changes
  const complexity: "low" | "medium" | "high" =
    step1.changes.length <= 3 ? "low" : step1.changes.length <= 10 ? "medium" : "high";

  // Extract technologies from step2
  const technologies = (step2.tech_stack_utilized || [])
    .filter((t) => t && t.name && typeof t.name === 'string')
    .map((t) => t.name);

  // Extract patterns from step2
  const patterns = (step2.design_patterns || [])
    .filter((p) => p && p.name && typeof p.name === 'string' && (p.confidence === "High" || p.confidence === "Medium"))
    .map((p) => p.name);

  return {
    prNumber: item.metadata.prNumber!,
    title: item.metadata.title || "Untitled PR",
    summary: step1.summary_high_level,
    technologies,
    patterns,
    complexity,
    impact: step2.architectural_impact,
    filesChanged: step1.changes.length,
  };
}

/**
 * Transforms Step 1 + Step 2 outputs into a rich CommitAnalysis
 */
export function createCommitAnalysis(
  step1: Step1Output,
  step2: Step2Output,
  item: ContributionItem
): CommitAnalysis {
  if (item.type !== "commit") {
    throw new Error("Item must be a commit to create CommitAnalysis");
  }

  // Extract technologies from step2
  const technologies = (step2.tech_stack_utilized || [])
    .filter((t) => t && t.name && typeof t.name === 'string')
    .map((t) => t.name);

  // Extract patterns from step2
  const patterns = (step2.design_patterns || [])
    .filter((p) => p && p.name && typeof p.name === 'string' && (p.confidence === "High" || p.confidence === "Medium"))
    .map((p) => p.name);

  return {
    sha: item.metadata.sha!,
    message: item.commitMessages,
    summary: step1.summary_high_level,
    technologies,
    patterns,
    filesChanged: step1.changes.length,
    impact: step2.architectural_impact,
  };
}

/**
 * Builds a rich AnalysisResult from all pipeline outputs
 */
export function buildRichAnalysisResult(
  step1Results: Step1Output[],
  step2Results: Step2Output[],
  contributionItems: ContributionItem[]
): AnalysisResult {
  const prAnalyses: PRAnalysis[] = [];
  const commitAnalyses: CommitAnalysis[] = [];

  // Create rich analyses for each item
  for (let i = 0; i < contributionItems.length; i++) {
    const item = contributionItems[i];
    const step1 = step1Results[i];
    const step2 = step2Results[i];

    try {
      if (item.type === "pr") {
        prAnalyses.push(createPRAnalysis(step1, step2, item));
      } else {
        commitAnalyses.push(createCommitAnalysis(step1, step2, item));
      }
    } catch (error) {
      console.error(`Failed to create rich analysis for ${item.type}:`, error);
    }
  }

  // Aggregate technologies
  const techMap = new Map<string, number>();
  for (const result of step2Results) {
    if (result.tech_stack_utilized && Array.isArray(result.tech_stack_utilized)) {
      for (const tech of result.tech_stack_utilized) {
        if (tech && tech.name && typeof tech.name === 'string') {
          techMap.set(tech.name, (techMap.get(tech.name) || 0) + 1);
        }
      }
    }
  }
  const keyTechnologies = Array.from(techMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name]) => name);

  // Aggregate patterns
  const patternMap = new Map<string, number>();
  for (const result of step2Results) {
    if (result.design_patterns && Array.isArray(result.design_patterns)) {
      for (const pattern of result.design_patterns) {
        if (pattern && pattern.name && typeof pattern.name === 'string' && (pattern.confidence === "High" || pattern.confidence === "Medium")) {
          patternMap.set(pattern.name, (patternMap.get(pattern.name) || 0) + 1);
        }
      }
    }
  }
  const keyPatterns = Array.from(patternMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name]) => name);

  // Extract recommendations from key decisions
  const recommendations = step2Results
    .flatMap((r) => r.key_decisions)
    .filter((decision) => decision && decision.length > 0)
    .slice(0, 5);

  // Calculate metadata
  const totalFilesChanged = step1Results.reduce((sum, s1) => sum + s1.changes.length, 0);
  const complexityDistribution = {
    low: prAnalyses.filter((pr) => pr.complexity === "low").length,
    medium: prAnalyses.filter((pr) => pr.complexity === "medium").length,
    high: prAnalyses.filter((pr) => pr.complexity === "high").length,
  };

  return {
    prAnalyses,
    commitAnalyses,
    overallSummary: "", // Will be filled by consolidated report
    keyTechnologies,
    keyPatterns,
    recommendations,
    metadata: {
      totalPRs: prAnalyses.length,
      totalCommits: commitAnalyses.length,
      totalFilesChanged,
      totalAdditions: 0, // TODO: Extract from GitHub data if available
      totalDeletions: 0, // TODO: Extract from GitHub data if available
      complexityDistribution,
    },
  };
}
