import { LLM } from "@/lib/constants"
import { HumanMessage, SystemMessage } from "@langchain/core/messages"
import { ChatOpenAI } from "@langchain/openai"
import type { AnalysisContext } from "./context-types"
import { DEFAULT_CONTEXT } from "./context-types"
import { generateStep2SystemPrompt, generateStep2UserPrompt } from "./prompt-templates"
import type { ContributionItem, Step1Output, Step2Output } from "./types"
import { getUserOpenAIKey } from "./utils"

// Types for parsed JSON response from LLM
interface ParsedTechStackItem {
  name?: unknown
  purpose?: unknown
}

interface ParsedDesignPattern {
  name?: unknown
  confidence?: unknown
  justification?: unknown
}

interface ParsedStep2Response {
  tech_stack_utilized?: unknown
  design_patterns?: unknown
  key_decisions?: unknown
  architectural_impact?: unknown
}

function buildUserPrompt(
  step1Output: Step1Output,
  keySnippets: string = "No additional code snippets provided",
  context: AnalysisContext = DEFAULT_CONTEXT
): string {
  return generateStep2UserPrompt(context, JSON.stringify(step1Output, null, 2), keySnippets)
}

export async function runStep2PatternRecognition(
  step1Output: Step1Output,
  contributionItem: ContributionItem,
  userId: string,
  context: AnalysisContext = DEFAULT_CONTEXT
): Promise<Step2Output> {
  // Get API key from database
  const openaiApiKey = await getUserOpenAIKey(userId)

  if (!openaiApiKey) {
    throw new Error("OpenAI API key is missing")
  }

  const llm = new ChatOpenAI({
    modelName: "gpt-5-nano", // Faster and cheaper model
    temperature: LLM.TEMPERATURE.ANALYSIS, // Slightly higher for reasoning but still controlled
    apiKey: openaiApiKey,
  })

  // Extract key snippets from the raw diff (first 2000 chars as sample)
  const keySnippets = contributionItem.rawDiff.substring(0, 2000)

  const systemPrompt = generateStep2SystemPrompt(context)
  const userPrompt = buildUserPrompt(step1Output, keySnippets, context)

  const messages = [new SystemMessage(systemPrompt), new HumanMessage(userPrompt)]

  console.log(
    `\n[Step 2] Analyzing patterns for ${contributionItem.type} - ${contributionItem.metadata.title || contributionItem.metadata.sha}`
  )

  try {
    const response = await llm.invoke(messages)
    const content = response.content as string

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("Failed to extract JSON from LLM response")
    }

    const parsed = JSON.parse(jsonMatch[0]) as ParsedStep2Response

    // Validate and normalize the result structure
    const result: Step2Output = {
      tech_stack_utilized: Array.isArray(parsed.tech_stack_utilized)
        ? parsed.tech_stack_utilized
            .filter(
              (t): t is ParsedTechStackItem =>
                t !== null &&
                typeof t === "object" &&
                typeof (t as ParsedTechStackItem).name === "string"
            )
            .map((t) => ({
              name: t.name as string,
              purpose: typeof t.purpose === "string" ? t.purpose : "",
            }))
        : [],
      design_patterns: Array.isArray(parsed.design_patterns)
        ? parsed.design_patterns
            .filter(
              (p): p is ParsedDesignPattern =>
                p !== null &&
                typeof p === "object" &&
                typeof (p as ParsedDesignPattern).name === "string"
            )
            .map((p) => {
              const confidence = typeof p.confidence === "string" ? p.confidence : ""
              return {
                name: p.name as string,
                confidence: ["High", "Medium", "Low"].includes(confidence)
                  ? (confidence as "High" | "Medium" | "Low")
                  : "Low",
                justification: typeof p.justification === "string" ? p.justification : "",
              }
            })
        : [],
      key_decisions: Array.isArray(parsed.key_decisions)
        ? parsed.key_decisions.filter((d): d is string => typeof d === "string")
        : [],
      architectural_impact:
        typeof parsed.architectural_impact === "string"
          ? parsed.architectural_impact
          : "No architectural impact identified",
    }

    console.log(`[Step 2] ✓ Identified ${result.design_patterns.length} design patterns`)
    console.log(`[Step 2] ✓ Identified ${result.tech_stack_utilized.length} technologies`)
    console.log(`[Step 2] ✓ Extracted ${result.key_decisions.length} key decisions`)

    return result
  } catch (error) {
    console.error(`[Step 2] ✗ Error:`, error)
    throw new Error(
      `Step 2 pattern recognition failed: ${error instanceof Error ? error.message : "Unknown error"}`
    )
  }
}

export async function runStep2Batch(
  step1Results: Step1Output[],
  contributionItems: ContributionItem[],
  userId: string,
  context: AnalysisContext = DEFAULT_CONTEXT,
  onProgress?: (current: number, total: number) => void
): Promise<Step2Output[]> {
  console.log(`\n=== STEP 2: PATTERN RECOGNITION & REASONING ===`)
  console.log(`Processing ${step1Results.length} summaries...`)

  if (step1Results.length !== contributionItems.length) {
    throw new Error(
      `Mismatch between Step 1 results (${step1Results.length}) and contribution items (${contributionItems.length})`
    )
  }

  const results: Step2Output[] = []

  for (let i = 0; i < step1Results.length; i++) {
    const step1Output = step1Results[i]
    const contributionItem = contributionItems[i]

    try {
      const result = await runStep2PatternRecognition(
        step1Output,
        contributionItem,
        userId,
        context
      )
      results.push(result)
      onProgress?.(i + 1, step1Results.length)
    } catch (error) {
      console.error(`Failed to process item ${i}:`, error)
      // Continue with other items even if one fails
      results.push({
        tech_stack_utilized: [],
        design_patterns: [],
        key_decisions: [],
        architectural_impact: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      })
      onProgress?.(i + 1, step1Results.length)
    }
  }

  console.log(`\n[Step 2] Completed: ${results.length}/${step1Results.length} items processed`)
  return results
}

/**
 * Aggregates Step 2 results to identify common patterns and technologies across all contributions
 */
export function aggregateStep2Results(results: Step2Output[]): {
  commonTechnologies: Map<string, number>
  commonPatterns: Map<string, number>
  allKeyDecisions: string[]
} {
  const techMap = new Map<string, number>()
  const patternMap = new Map<string, number>()
  const decisions: string[] = []

  for (const result of results) {
    // Count technologies
    if (result.tech_stack_utilized && Array.isArray(result.tech_stack_utilized)) {
      for (const tech of result.tech_stack_utilized) {
        if (tech && tech.name && typeof tech.name === "string") {
          techMap.set(tech.name, (techMap.get(tech.name) || 0) + 1)
        }
      }
    }

    // Count patterns
    if (result.design_patterns && Array.isArray(result.design_patterns)) {
      for (const pattern of result.design_patterns) {
        if (pattern && pattern.name && typeof pattern.name === "string") {
          patternMap.set(pattern.name, (patternMap.get(pattern.name) || 0) + 1)
        }
      }
    }

    // Collect all decisions
    if (result.key_decisions && Array.isArray(result.key_decisions)) {
      decisions.push(...result.key_decisions.filter((d) => d && typeof d === "string"))
    }
  }

  return {
    commonTechnologies: techMap,
    commonPatterns: patternMap,
    allKeyDecisions: decisions,
  }
}
