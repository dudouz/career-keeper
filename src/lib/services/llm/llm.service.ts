import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { decryptToken } from "@/lib/github/encryption"
import { LLMClient } from "@/lib/llm/client"
import { eq } from "drizzle-orm"
import type {
  AnalyzeContributionsParams,
  AnalyzeContributionsResult,
  GenerateSummaryParams,
  GenerateSummaryResult,
  CompareResumeParams,
  CompareResumeResult,
} from "./llm.types"

// Helper: Get user's OpenAI API key
async function getUserOpenAIKey(userId: string): Promise<string> {
  const [user] = await db
    .select({ openaiApiKey: users.openaiApiKey })
    .from(users)
    .where(eq(users.id, userId))

  if (!user?.openaiApiKey) {
    throw new Error("OpenAI API key not found. Please add it in settings.")
  }

  try {
    return decryptToken(user.openaiApiKey)
  } catch (error) {
    console.error("Failed to decrypt OpenAI API key:", error)
    throw new Error("Failed to decrypt API key. Please re-configure your OpenAI API key.")
  }
}

/**
 * Analyze GitHub contributions and extract resume-worthy achievements
 */
export async function analyzeContributions(
  params: AnalyzeContributionsParams
): Promise<AnalyzeContributionsResult> {
  const { userId, contributions } = params

  // Get API key
  const apiKey = await getUserOpenAIKey(userId)

  // Create LLM client and analyze
  const llmClient = new LLMClient({ apiKey })
  const analysis = await llmClient.analyzeContributions(contributions)

  // Estimate tokens used
  const estimatedTokens = llmClient.estimateTokens(
    JSON.stringify(contributions) + JSON.stringify(analysis)
  )

  return {
    ...analysis,
    estimatedTokens,
  }
}

/**
 * Generate professional resume summary from contributions
 */
export async function generateSummary(
  params: GenerateSummaryParams
): Promise<GenerateSummaryResult> {
  const { userId, contributions, currentSummary, tone = "hybrid" } = params

  // Validate tone
  const validTones = ["technical", "leadership", "hybrid"]
  if (!validTones.includes(tone)) {
    throw new Error(`Invalid tone. Must be one of: ${validTones.join(", ")}`)
  }

  // Get API key
  const apiKey = await getUserOpenAIKey(userId)

  // Create LLM client and generate summary
  const llmClient = new LLMClient({ apiKey })
  const summary = await llmClient.generateSummary({
    contributions,
    currentSummary,
    tone,
  })

  // Estimate tokens used
  const estimatedTokens = llmClient.estimateTokens(
    JSON.stringify(contributions) + JSON.stringify(summary)
  )

  return {
    ...summary,
    estimatedTokens,
  }
}

/**
 * Compare existing resume with GitHub contributions
 */
export async function compareResumeWithContributions(
  params: CompareResumeParams
): Promise<CompareResumeResult> {
  const { userId, existingResume, contributions } = params

  // Get API key
  const apiKey = await getUserOpenAIKey(userId)

  // Create LLM client and compare
  const llmClient = new LLMClient({ apiKey })
  const comparison = await llmClient.compareResumeWithContributions({
    existingResume,
    contributions,
  })

  // Estimate tokens used
  const estimatedTokens = llmClient.estimateTokens(
    existingResume + JSON.stringify(contributions) + JSON.stringify(comparison)
  )

  return {
    ...comparison,
    estimatedTokens,
  }
}
