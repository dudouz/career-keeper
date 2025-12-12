import type { GitHubContributionData } from "@/lib/db/types";
import type { ConsolidatedReport } from "./types";
import type { AnalysisContext } from "./context-types";
import { DEFAULT_CONTEXT } from "./context-types";
import {
  githubContributionsToItems,
  generateRAGContext,
  buildRichAnalysisResult,
} from "./helpers";
import { runStep1Batch } from "./step1-extraction";
import { runStep2Batch } from "./step2-pattern-recognition";
import { runStep3Batch, generateConsolidatedReport } from "./step3-final-reporting";

export interface PipelineOptions {
  maxCommits?: number;
  maxPRs?: number;
  maxIssues?: number;
  maxReleases?: number;
  includeRAGContext?: boolean;
  context?: AnalysisContext; // NEW: Analysis context for customizing prompts
  contributionTypes?: ("pr" | "commit" | "issue" | "release")[]; // Filter by contribution types
  onProgress?: (progress: {
    step: "step1" | "step2" | "step3" | "consolidated";
    current: number;
    total: number;
    message: string;
  }) => void; // Progress callback for streaming
}

export interface PipelineResult {
  success: boolean;
  consolidatedReport?: ConsolidatedReport;
  error?: string;
  metadata: {
    totalContributions: number;
    processedContributions: number;
    step1CompletedAt?: Date;
    step2CompletedAt?: Date;
    step3CompletedAt?: Date;
    totalDurationMs?: number;
  };
}

/**
 * Main Chain of Density Pipeline for GitHub Contributions Analysis
 *
 * This pipeline implements a 3-step analysis process:
 * 1. Extraction & Summary: Identifies WHAT changed
 * 2. Pattern Recognition & Reasoning: Identifies HOW and WHY
 * 3. Final Reporting: Presents the analysis professionally
 *
 * @param contributions - GitHub contribution data from the database
 * @param userId - User ID to retrieve OpenAI API key from database
 * @param options - Pipeline configuration options
 * @returns Consolidated report with individual analyses
 */
export async function runChainOfDensityPipeline(
  contributions: GitHubContributionData,
  userId: string,
  options: PipelineOptions = {}
): Promise<PipelineResult> {
  // Validate userId
  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    return {
      success: false,
      error: "User ID is required",
      metadata: {
        totalContributions: 0,
        processedContributions: 0,
        totalDurationMs: 0,
      },
    };
  }

  const startTime = Date.now();
  const {
    maxCommits = 20,
    maxPRs = 10,
    maxIssues = 10,
    maxReleases = 5,
    includeRAGContext = true,
    context = DEFAULT_CONTEXT,
    contributionTypes = ["pr", "commit"],
    onProgress,
  } = options;

  console.log("\n");
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║     CHAIN OF DENSITY PIPELINE - GitHub Analysis         ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log(`📊 Context: ${context.seniority} ${context.role} - ${context.objective}`);
  console.log(`📋 Contribution Types: ${contributionTypes.join(", ")}`);
  console.log("\n");

  try {
    // Step 0: Prepare data
    console.log("📋 Preparing contribution items...");
    onProgress?.({
      step: "step1",
      current: 0,
      total: 0,
      message: "Preparing contributions...",
    });

    const contributionItems = githubContributionsToItems(contributions, {
      maxCommits,
      maxPRs,
      maxIssues,
      maxReleases,
      contributionTypes,
    });

    const ragContext = includeRAGContext
      ? generateRAGContext(contributions)
      : "";

    const totalItems = contributionItems.length;
    console.log(`✓ Prepared ${totalItems} contributions for analysis`);
    console.log(`  - PRs: ${contributionItems.filter((i) => i.type === "pr").length}`);
    console.log(`  - Commits: ${contributionItems.filter((i) => i.type === "commit").length}`);

    if (totalItems === 0) {
      return {
        success: false,
        error: "No contributions found to analyze",
        metadata: {
          totalContributions: 0,
          processedContributions: 0,
          totalDurationMs: Date.now() - startTime,
        },
      };
    }

    // Step 1: Extraction & Summary
    console.log("\n" + "=".repeat(60));
    onProgress?.({
      step: "step1",
      current: 0,
      total: totalItems,
      message: `Step 1: Extracting changes from ${totalItems} contributions...`,
    });
    const step1Results = await runStep1Batch(
      contributionItems,
      ragContext,
      userId,
      context,
      (current, total) => {
        onProgress?.({
          step: "step1",
          current,
          total,
          message: `Step 1: Processing ${current}/${total} contributions...`,
        });
      }
    );
    const step1CompletedAt = new Date();
    console.log(`✓ Step 1 completed at ${step1CompletedAt.toISOString()}`);
    onProgress?.({
      step: "step1",
      current: totalItems,
      total: totalItems,
      message: "Step 1: Extraction complete!",
    });

    // Step 2: Pattern Recognition & Reasoning
    console.log("\n" + "=".repeat(60));
    onProgress?.({
      step: "step2",
      current: 0,
      total: totalItems,
      message: `Step 2: Analyzing patterns in ${totalItems} contributions...`,
    });
    const step2Results = await runStep2Batch(
      step1Results,
      contributionItems,
      userId,
      context,
      (current, total) => {
        onProgress?.({
          step: "step2",
          current,
          total,
          message: `Step 2: Analyzing patterns ${current}/${total}...`,
        });
      }
    );
    const step2CompletedAt = new Date();
    console.log(`✓ Step 2 completed at ${step2CompletedAt.toISOString()}`);
    onProgress?.({
      step: "step2",
      current: totalItems,
      total: totalItems,
      message: "Step 2: Pattern recognition complete!",
    });

    // Step 3: Final Reporting
    console.log("\n" + "=".repeat(60));
    onProgress?.({
      step: "step3",
      current: 0,
      total: totalItems,
      message: `Step 3: Generating reports for ${totalItems} contributions...`,
    });
    const step3Results = await runStep3Batch(
      step1Results,
      step2Results,
      contributionItems,
      userId,
      context,
      (current, total) => {
        onProgress?.({
          step: "step3",
          current,
          total,
          message: `Step 3: Generating report ${current}/${total}...`,
        });
      }
    );
    const step3CompletedAt = new Date();
    console.log(`✓ Step 3 completed at ${step3CompletedAt.toISOString()}`);
    onProgress?.({
      step: "step3",
      current: totalItems,
      total: totalItems,
      message: "Step 3: Report generation complete!",
    });

    // Build rich analysis result
    console.log("\n" + "=".repeat(60));
    console.log("🔍 Building rich analysis result...");
    const richAnalysisResult = buildRichAnalysisResult(
      step1Results,
      step2Results,
      contributionItems
    );
    console.log(`✓ Rich analysis completed`);
    console.log(`  - PRs analyzed: ${richAnalysisResult.prAnalyses.length}`);
    console.log(`  - Commits analyzed: ${richAnalysisResult.commitAnalyses.length}`);
    console.log(`  - Technologies identified: ${richAnalysisResult.keyTechnologies.length}`);
    console.log(`  - Patterns identified: ${richAnalysisResult.keyPatterns.length}`);

    // Generate consolidated report
    console.log("\n" + "=".repeat(60));
    onProgress?.({
      step: "consolidated",
      current: 0,
      total: 1,
      message: "Generating consolidated report...",
    });
    const consolidatedReport = await generateConsolidatedReport(
      step3Results,
      step2Results,
      richAnalysisResult,
      userId
    );
    onProgress?.({
      step: "consolidated",
      current: 1,
      total: 1,
      message: "Analysis complete!",
    });

    const totalDurationMs = Date.now() - startTime;

    console.log("\n");
    console.log("╔══════════════════════════════════════════════════════════╗");
    console.log("║              PIPELINE COMPLETED SUCCESSFULLY             ║");
    console.log("╚══════════════════════════════════════════════════════════╝");
    console.log(`⏱️  Total Duration: ${(totalDurationMs / 1000).toFixed(2)}s`);
    console.log(`📊 Contributions Analyzed: ${step3Results.length}`);
    console.log("\n");

    return {
      success: true,
      consolidatedReport,
      metadata: {
        totalContributions: contributionItems.length,
        processedContributions: step3Results.length,
        step1CompletedAt,
        step2CompletedAt,
        step3CompletedAt,
        totalDurationMs,
      },
    };
  } catch (error) {
    console.error("\n❌ Pipeline failed:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      metadata: {
        totalContributions: 0,
        processedContributions: 0,
        totalDurationMs: Date.now() - startTime,
      },
    };
  }
}

/**
 * Exports all individual steps for granular control
 */
export { runStep1Batch } from "./step1-extraction";
export { runStep2Batch, aggregateStep2Results } from "./step2-pattern-recognition";
export { runStep3Batch, generateConsolidatedReport } from "./step3-final-reporting";
export * from "./types";
export * from "./helpers";
