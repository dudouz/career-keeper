import { LLM } from "@/lib/constants"
import { HumanMessage, SystemMessage } from "@langchain/core/messages"
import { ChatOpenAI } from "@langchain/openai"
import type { AnalysisContext } from "./context-types"
import { DEFAULT_CONTEXT } from "./context-types"
import { generateStep1SystemPrompt, generateStep1UserPrompt } from "./prompt-templates"
import type { ContributionItem, Step1Output } from "./types"
import { getUserOpenAIKey } from "./utils"
function buildUserPrompt(
  item: ContributionItem,
  ragContext: string = "No additional context available",
  context: AnalysisContext = DEFAULT_CONTEXT
): string {
  return generateStep1UserPrompt(context, ragContext, item.commitMessages, item.rawDiff)
}

export async function runStep1Extraction(
  item: ContributionItem,
  ragContext: string = "",
  userId: string,
  context: AnalysisContext = DEFAULT_CONTEXT
): Promise<Step1Output> {
  // Get API key from database
  const openaiApiKey = await getUserOpenAIKey(userId)

  if (!openaiApiKey) {
    throw new Error("OpenAI API key is missing")
  }

  const llm = new ChatOpenAI({
    modelName: "gpt-5-nano", // Faster and cheaper model
    temperature: LLM.TEMPERATURE.ANALYSIS,
    apiKey: openaiApiKey,
  })

  const systemPrompt = generateStep1SystemPrompt(context)
  const userPrompt = buildUserPrompt(item, ragContext, context)

  const messages = [new SystemMessage(systemPrompt), new HumanMessage(userPrompt)]

  console.log(`\n[Step 1] Analyzing ${item.type} - ${item.metadata.title || item.metadata.sha}`)

  try {
    const response = await llm.invoke(messages)
    const content = response.content as string

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("Failed to extract JSON from LLM response")
    }

    const result: Step1Output = JSON.parse(jsonMatch[0])

    console.log(`[Step 1] ✓ Extracted ${result.changes.length} changes`)
    console.log(`[Step 1] ✓ Summary: ${result.summary_high_level}`)

    return result
  } catch (error) {
    console.error(`[Step 1] ✗ Error:`, error)
    throw new Error(
      `Step 1 extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`
    )
  }
}

export async function runStep1Batch(
  items: ContributionItem[],
  ragContext: string = "",
  userId: string,
  context: AnalysisContext = DEFAULT_CONTEXT,
  onProgress?: (current: number, total: number) => void
): Promise<Step1Output[]> {
  console.log(`\n=== STEP 1: EXTRACTION & SUMMARY ===`)
  console.log(`Processing ${items.length} contributions...`)
  console.log(`Context: ${context.seniority} ${context.role} - ${context.objective}`)

  const results: Step1Output[] = []

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    try {
      const result = await runStep1Extraction(item, ragContext, userId, context)
      results.push(result)
      onProgress?.(i + 1, items.length)
    } catch (error) {
      console.error(`Failed to process ${item.type}:`, error)
      // Continue with other items even if one fails
      results.push({
        summary_high_level: "Failed to analyze",
        changes: [],
        new_dependencies: [],
        rag_utilization: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      })
      onProgress?.(i + 1, items.length)
    }
  }

  console.log(`\n[Step 1] Completed: ${results.length}/${items.length} items processed`)
  return results
}
