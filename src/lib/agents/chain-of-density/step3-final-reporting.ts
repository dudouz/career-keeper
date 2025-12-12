import { LLM } from "@/lib/constants"
import { HumanMessage, SystemMessage } from "@langchain/core/messages"
import { ChatOpenAI } from "@langchain/openai"
import type { AnalysisContext } from "./context-types"
import { DEFAULT_CONTEXT } from "./context-types"
import { generateStep3SystemPrompt, generateStep3UserPrompt } from "./prompt-templates"
import type {
  AnalysisResult,
  ConsolidatedReport,
  ContributionItem,
  Step1Output,
  Step2Output,
  Step3Output,
} from "./types"
import { getUserOpenAIKey } from "./utils"

function buildUserPrompt(
  step1Output: Step1Output,
  step2Output: Step2Output,
  context: AnalysisContext = DEFAULT_CONTEXT
): string {
  return generateStep3UserPrompt(
    context,
    JSON.stringify(step1Output, null, 2),
    JSON.stringify(step2Output, null, 2)
  )
}

export async function runStep3FinalReporting(
  step1Output: Step1Output,
  step2Output: Step2Output,
  contributionItem: ContributionItem,
  userId: string,
  context: AnalysisContext = DEFAULT_CONTEXT
): Promise<Step3Output> {
  // Get API key from database
  const openaiApiKey = await getUserOpenAIKey(userId)

  if (!openaiApiKey) {
    throw new Error("OpenAI API key is missing")
  }

  const llm = new ChatOpenAI({
    modelName: "gpt-5-nano", // Faster and cheaper model
    temperature: LLM.TEMPERATURE.CREATIVE, // Higher temperature for more engaging writing
    apiKey: openaiApiKey,
  })

  const systemPrompt = generateStep3SystemPrompt(context)
  const userPrompt = buildUserPrompt(step1Output, step2Output, context)

  const messages = [new SystemMessage(systemPrompt), new HumanMessage(userPrompt)]

  console.log(
    `\n[Step 3] Generating report for ${contributionItem.type} - ${contributionItem.metadata.title || contributionItem.metadata.sha}`
  )

  try {
    const response = await llm.invoke(messages)
    const markdownReport = response.content as string

    console.log(`[Step 3] ✓ Generated report (${markdownReport.length} characters)`)

    return {
      markdownReport,
      contributionMetadata: {
        type: contributionItem.type,
        identifier:
          contributionItem.type === "pr"
            ? `#${contributionItem.metadata.prNumber}`
            : contributionItem.metadata.sha?.substring(0, 7) || "unknown",
        title: contributionItem.metadata.title,
        author: contributionItem.metadata.author,
        date: contributionItem.metadata.date,
      },
    }
  } catch (error) {
    console.error(`[Step 3] ✗ Error:`, error)
    throw new Error(
      `Step 3 final reporting failed: ${error instanceof Error ? error.message : "Unknown error"}`
    )
  }
}

export async function runStep3Batch(
  step1Results: Step1Output[],
  step2Results: Step2Output[],
  contributionItems: ContributionItem[],
  userId: string,
  context: AnalysisContext = DEFAULT_CONTEXT,
  onProgress?: (current: number, total: number) => void
): Promise<Step3Output[]> {
  console.log(`\n=== STEP 3: FINAL REPORTING ===`)
  console.log(`Generating reports for ${step1Results.length} contributions...`)

  if (
    step1Results.length !== step2Results.length ||
    step1Results.length !== contributionItems.length
  ) {
    throw new Error(
      `Mismatch in array lengths: Step1(${step1Results.length}), Step2(${step2Results.length}), Items(${contributionItems.length})`
    )
  }

  const results: Step3Output[] = []

  for (let i = 0; i < step1Results.length; i++) {
    const step1Output = step1Results[i]
    const step2Output = step2Results[i]
    const contributionItem = contributionItems[i]

    try {
      const result = await runStep3FinalReporting(
        step1Output,
        step2Output,
        contributionItem,
        userId,
        context
      )
      results.push(result)
      onProgress?.(i + 1, step1Results.length)
    } catch (error) {
      console.error(`Failed to generate report for item ${i}:`, error)
      // Create a basic error report
      results.push({
        markdownReport: `# ❌ Error Generating Report\n\nFailed to generate report for this contribution.\n\nError: ${error instanceof Error ? error.message : "Unknown error"}`,
        contributionMetadata: {
          type: contributionItem.type,
          identifier:
            contributionItem.type === "pr"
              ? `#${contributionItem.metadata.prNumber}`
              : contributionItem.metadata.sha?.substring(0, 7) || "unknown",
          title: contributionItem.metadata.title,
          author: contributionItem.metadata.author,
          date: contributionItem.metadata.date,
        },
      })
      onProgress?.(i + 1, step1Results.length)
    }
  }

  console.log(`\n[Step 3] Completed: ${results.length}/${step1Results.length} reports generated`)
  return results
}

/**
 * Generates a consolidated report aggregating all individual contribution reports
 */
export async function generateConsolidatedReport(
  individualReports: Step3Output[],
  step2Results: Step2Output[],
  richAnalysisResult: AnalysisResult,
  userId: string
): Promise<ConsolidatedReport> {
  console.log(`\n[Step 3] Generating consolidated report...`)

  // Aggregate technologies
  const techMap = new Map<string, number>()
  for (const result of step2Results) {
    if (result.tech_stack_utilized && Array.isArray(result.tech_stack_utilized)) {
      for (const tech of result.tech_stack_utilized) {
        if (tech && tech.name && typeof tech.name === "string") {
          techMap.set(tech.name, (techMap.get(tech.name) || 0) + 1)
        }
      }
    }
  }
  const topTechnologies = Array.from(techMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }))

  // Aggregate patterns
  const patternMap = new Map<string, number>()
  for (const result of step2Results) {
    if (result.design_patterns && Array.isArray(result.design_patterns)) {
      for (const pattern of result.design_patterns) {
        if (pattern && pattern.name && typeof pattern.name === "string") {
          patternMap.set(pattern.name, (patternMap.get(pattern.name) || 0) + 1)
        }
      }
    }
  }
  const topPatterns = Array.from(patternMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }))

  // Extract key achievements from architectural impacts
  const keyAchievements = step2Results
    .map((r) => r.architectural_impact)
    .filter((impact) => impact && !impact.startsWith("Error"))
    .slice(0, 5)

  // Get API key from database
  const openaiApiKey = await getUserOpenAIKey(userId)

  if (!openaiApiKey) {
    throw new Error("OpenAI API key is missing")
  }

  // Generate overall summary using LLM
  const llm = new ChatOpenAI({
    modelName: "gpt-5-nano", // Faster and cheaper model
    temperature: LLM.TEMPERATURE.CREATIVE,
    apiKey: openaiApiKey,
  })

  const summaryPrompt = `Based on ${individualReports.length} analyzed contributions, generate a comprehensive executive summary.

Top Technologies Used:
${topTechnologies.map((t) => `- ${t.name} (${t.count} occurrences)`).join("\n")}

Top Design Patterns:
${topPatterns.map((p) => `- ${p.name} (${p.count} occurrences)`).join("\n")}

Key Architectural Impacts:
${keyAchievements.map((a, i) => `${i + 1}. ${a}`).join("\n")}

Generate a professional 3-4 paragraph summary highlighting:
1. The overall scope and nature of contributions
2. Technical depth and breadth demonstrated
3. Architectural maturity and decision-making quality
4. Professional value and impact

Write in Markdown format, professional tone.`

  try {
    const response = await llm.invoke([new HumanMessage(summaryPrompt)])
    const overallSummary = response.content as string

    // Update richAnalysisResult with the overall summary
    richAnalysisResult.overallSummary = overallSummary

    console.log(`[Step 3] ✓ Consolidated report generated`)

    return {
      overallSummary,
      individualReports,
      aggregatedInsights: {
        totalContributions: individualReports.length,
        topTechnologies,
        topPatterns,
        keyAchievements,
      },
      richAnalysisResult,
    }
  } catch (error) {
    console.error(`[Step 3] Failed to generate consolidated summary:`, error)

    // Fallback summary
    const fallbackSummary = `# Contribution Analysis Summary\n\nAnalyzed ${individualReports.length} contributions across multiple repositories.\n\n## Key Technologies\n${topTechnologies.map((t) => `- ${t.name}`).join("\n")}\n\n## Design Patterns\n${topPatterns.map((p) => `- ${p.name}`).join("\n")}`

    richAnalysisResult.overallSummary = fallbackSummary

    return {
      overallSummary: fallbackSummary,
      individualReports,
      aggregatedInsights: {
        totalContributions: individualReports.length,
        topTechnologies,
        topPatterns,
        keyAchievements,
      },
      richAnalysisResult,
    }
  }
}
