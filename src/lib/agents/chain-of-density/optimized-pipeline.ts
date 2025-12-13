import type { GitHubContributionData } from "@/lib/db/types";
import type { ConsolidatedReport } from "./types";
import type { AnalysisContext } from "./context-types";
import { DEFAULT_CONTEXT } from "./context-types";
import {
  githubContributionsToItems,
  generateRAGContext,
  buildRichAnalysisResult,
} from "./helpers";
import { getUserOpenAIKey } from "./utils";
import { LLM } from "@/lib/constants";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { ContributionItem, Step1Output, Step2Output, Step3Output } from "./types";
import { generateStep1SystemPrompt, generateStep2SystemPrompt, generateStep3SystemPrompt } from "./prompt-templates";

/**
 * Optimized pipeline that processes all contributions in a single consolidated LLM call
 * This dramatically reduces the number of API calls from 3N+1 to just 1 call
 */
export async function runOptimizedPipeline(
  contributions: GitHubContributionData,
  userId: string,
  options: {
    maxCommits?: number;
    maxPRs?: number;
    maxIssues?: number;
    maxReleases?: number;
    includeRAGContext?: boolean;
    context?: AnalysisContext;
    contributionTypes?: ("pr" | "commit" | "issue" | "release")[];
    onProgress?: (progress: {
      step: "analyzing" | "consolidated";
      current: number;
      total: number;
      message: string;
    }) => void;
  } = {}
): Promise<{
  success: boolean;
  consolidatedReport?: ConsolidatedReport;
  error?: string;
  metadata: {
    totalContributions: number;
    processedContributions: number;
    totalDurationMs: number;
  };
}> {
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

  try {
    // Prepare contribution items
    onProgress?.({
      step: "analyzing",
      current: 0,
      total: 1,
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

    // Get API key
    const openaiApiKey = await getUserOpenAIKey(userId);
    if (!openaiApiKey) {
      throw new Error("OpenAI API key is missing");
    }

    onProgress?.({
      step: "analyzing",
      current: 0,
      total: 1,
      message: `Analyzing ${totalItems} contributions in a single consolidated call...`,
    });

    // Build consolidated prompt that processes all contributions at once
    const systemPrompt = `You are an expert technical analyst specializing in GitHub contribution analysis. Your task is to analyze multiple contributions in a single comprehensive pass.

Context:
- Seniority: ${context.seniority}
- Role: ${context.role}
- Objective: ${context.objective}
${context.yearsOfExperience ? `- Years of Experience: ${context.yearsOfExperience}` : ""}
${context.targetJobTitle ? `- Target Job Title: ${context.targetJobTitle}` : ""}
${context.targetCompany ? `- Target Company: ${context.targetCompany}` : ""}
${context.customInstructions ? `- Custom Instructions: ${context.customInstructions}` : ""}

You will receive multiple contributions and must analyze each one comprehensively, then provide a consolidated summary.`;

    // Build user prompt with all contributions
    const contributionsData = contributionItems.map((item, index) => {
      const diffPreview = item.rawDiff?.substring(0, 2000) || "No diff available";
      const commitMessages = Array.isArray(item.commitMessages) 
        ? item.commitMessages.join("\n") 
        : item.commitMessages || "No commit messages";

      return `
## Contribution ${index + 1}: ${item.type.toUpperCase()}
**Title/Identifier:** ${item.metadata.title || item.metadata.sha || "N/A"}
**Author:** ${item.metadata.author || "N/A"}
**Date:** ${item.metadata.date || "N/A"}
**Repository:** ${item.metadata.repository || "N/A"}

**Commit Messages:**
${commitMessages}

**Code Diff (preview):**
\`\`\`
${diffPreview}
\`\`\`
`;
    }).join("\n\n---\n\n");

    const userPrompt = `Analyze the following ${totalItems} contributions comprehensively. For each contribution, provide:

1. **High-level Summary**: What was changed and why (2-3 sentences)
2. **Key Changes**: List of significant modifications (3-5 items)
3. **Technologies Used**: Technologies, frameworks, libraries identified
4. **Design Patterns**: Design patterns or architectural decisions observed
5. **Architectural Impact**: How this change affects the system architecture
6. **Professional Report**: A markdown-formatted professional summary suitable for ${context.objective}

After analyzing all contributions, provide:
- A consolidated executive summary (3-4 paragraphs)
- Aggregated insights: top technologies, patterns, and key achievements
- Individual reports for each contribution

${ragContext ? `\n**Additional Context:**\n${ragContext}\n` : ""}

**Contributions to Analyze:**
${contributionsData}

Return your response as a JSON object with this structure:
{
  "consolidatedSummary": "Executive summary in markdown format",
  "aggregatedInsights": {
    "topTechnologies": [{"name": "Tech Name", "count": 1}],
    "topPatterns": [{"name": "Pattern Name", "count": 1}],
    "keyAchievements": ["Achievement 1", "Achievement 2"]
  },
  "individualReports": [
    {
      "contributionIndex": 0,
      "summary": "High-level summary",
      "keyChanges": ["Change 1", "Change 2"],
      "technologies": ["Tech 1", "Tech 2"],
      "patterns": ["Pattern 1"],
      "architecturalImpact": "Impact description",
      "markdownReport": "Full professional markdown report"
    }
  ]
}`;

    const llm = new ChatOpenAI({
      modelName: "gpt-5-nano", // Faster and cheaper model
      temperature: LLM.TEMPERATURE.ANALYSIS,
      apiKey: openaiApiKey,
      maxTokens: 16000, // Increased for consolidated analysis
    });

    const response = await llm.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userPrompt),
    ]);

    const content = response.content as string;

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to extract JSON from LLM response");
    }

    const result = JSON.parse(jsonMatch[0]);

    // Transform to match expected ConsolidatedReport format
    // Sort reports by contributionIndex to ensure correct mapping
    const sortedReports = (result.individualReports || []).sort((a: any, b: any) => 
      (a.contributionIndex ?? 0) - (b.contributionIndex ?? 0)
    );

    const individualReports: Step3Output[] = sortedReports.map((report: any, index: number) => {
      const item = contributionItems[index] || contributionItems[report.contributionIndex ?? index];
      return {
        markdownReport: report.markdownReport || report.summary || "",
        contributionMetadata: {
          type: item?.type || "commit",
          identifier: item?.metadata.sha || item?.metadata.title || `contribution-${index}`,
          title: item?.metadata.title,
          author: item?.metadata.author,
          date: item?.metadata.date,
        },
      };
    });

    // Build rich analysis result
    const step1Results = sortedReports.map((report: any, index: number) => ({
      summary_high_level: report.summary || "",
      changes: report.keyChanges || [],
      new_dependencies: [],
      rag_utilization: "",
    }));

    const step2Results = sortedReports.map((report: any) => ({
      tech_stack_utilized: (report.technologies || []).map((tech: string) => ({ name: tech, purpose: "" })),
      design_patterns: (report.patterns || []).map((pattern: string) => ({ name: pattern, confidence: "high", justification: "" })),
      key_decisions: [],
      architectural_impact: report.architecturalImpact || "",
    }));

    const richAnalysisResult = buildRichAnalysisResult(
      step1Results,
      step2Results,
      contributionItems.slice(0, sortedReports.length)
    );

    richAnalysisResult.overallSummary = result.consolidatedSummary;

    const consolidatedReport: ConsolidatedReport = {
      overallSummary: result.consolidatedSummary,
      individualReports,
      aggregatedInsights: {
        totalContributions: totalItems,
        topTechnologies: result.aggregatedInsights?.topTechnologies || [],
        topPatterns: result.aggregatedInsights?.topPatterns || [],
        keyAchievements: result.aggregatedInsights?.keyAchievements || [],
      },
      richAnalysisResult,
    };

    const totalDurationMs = Date.now() - startTime;

    console.log(`\n[Optimized Pipeline] ✓ Completed in ${(totalDurationMs / 1000).toFixed(2)}s`);
    console.log(`  - Contributions analyzed: ${totalItems}`);
    console.log(`  - API calls: 1 (vs ${3 * totalItems + 1} in standard pipeline)`);

    // Send final progress update before returning (if callback still available)
    try {
      onProgress?.({
        step: "consolidated",
        current: 1,
        total: 1,
        message: "Analysis complete!",
      });
    } catch (error) {
      // Ignore errors if stream is already closed
      console.warn("[Optimized Pipeline] Progress callback failed (stream may be closed):", error);
    }

    return {
      success: true,
      consolidatedReport,
      metadata: {
        totalContributions: totalItems,
        processedContributions: totalItems,
        totalDurationMs,
      },
    };
  } catch (error) {
    console.error("\n❌ Optimized pipeline failed:", error);

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

