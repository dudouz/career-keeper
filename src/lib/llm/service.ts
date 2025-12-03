/**
 * LLM service functions
 * These are pure functions that interact with OpenAI API
 */

import OpenAI from "openai"
import type { GitHubContributionData } from "@/lib/db/types"
import { LLM } from "@/lib/constants"

/**
 * Create an OpenAI client instance
 */
function createOpenAIClient(apiKey: string) {
  return new OpenAI({ apiKey })
}

/**
 * Analyze GitHub contributions and extract resume-worthy achievements
 */
export async function analyzeContributions(
  apiKey: string,
  contributions: GitHubContributionData,
  model: string = LLM.DEFAULT_MODEL
): Promise<{
  achievements: string[]
  skills: string[]
  projects: Array<{ name: string; description: string; highlights: string[] }>
}> {
  const client = createOpenAIClient(apiKey)

  const prompt = `Analyze the following GitHub contributions and extract resume-worthy achievements, skills, and project highlights.

Repositories: ${contributions.repositories.length}
Commits: ${contributions.commits.length}
Pull Requests: ${contributions.pullRequests.length}
Issues: ${contributions.issues.length}

Top repositories:
${contributions.repositories
  .slice(0, LLM.MAX_REPOS_IN_PROMPT)
  .map((r) => `- ${r.name}: ${r.description?.slice(0, LLM.MAX_DESCRIPTION_LENGTH) || "No description"}`)
  .join("\n")}

Recent commits:
${contributions.commits
  .slice(0, LLM.MAX_RECENT_COMMITS)
  .map((c) => `- ${c.message}`)
  .join("\n")}

Extract:
1. Key achievements (quantifiable when possible)
2. Technical skills demonstrated
3. Notable projects with descriptions and highlights

Return as JSON with this structure:
{
  "achievements": ["achievement 1", "achievement 2"],
  "skills": ["skill1", "skill2"],
  "projects": [
    {
      "name": "project name",
      "description": "brief description",
      "highlights": ["highlight 1", "highlight 2"]
    }
  ]
}`

  const completion = await client.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content:
          "You are a professional resume writer and career coach. Extract meaningful, quantifiable achievements from technical contributions.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    response_format: { type: "json_object" },
    temperature: LLM.TEMPERATURE.ANALYSIS,
  })

  const content = completion.choices[0].message.content || "{}"
  return JSON.parse(content)
}

/**
 * Generate a professional summary from contributions and resume
 */
export async function generateSummary(
  apiKey: string,
  params: {
    contributions: GitHubContributionData
    currentSummary?: string
    tone?: "technical" | "leadership" | "hybrid"
  },
  model: string = LLM.DEFAULT_MODEL
): Promise<{
  summary: string
  alternatives: string[]
}> {
  const client = createOpenAIClient(apiKey)
  const { contributions, currentSummary, tone = "hybrid" } = params

  const toneGuidance = {
    technical: "Focus on technical expertise, technologies, and hands-on contributions",
    leadership: "Emphasize leadership, mentorship, and strategic impact",
    hybrid: "Balance technical skills with leadership and collaboration",
  }

  const prompt = `Generate a professional resume summary based on the following:

Current Summary: ${currentSummary || "None provided"}

GitHub Activity:
- ${contributions.repositories.length} repositories
- ${contributions.commits.length} commits
- ${contributions.pullRequests.length} pull requests
- ${contributions.issues.length} issues resolved

Top Skills: ${Object.keys(contributions.languages || {})
    .slice(0, LLM.MAX_RECENT_COMMITS)
    .join(", ")}

Tone: ${tone} - ${toneGuidance[tone]}

Generate:
1. One primary summary (2-3 sentences, ~50 words)
2. Two alternative versions

Return as JSON:
{
  "summary": "primary summary",
  "alternatives": ["alternative 1", "alternative 2"]
}`

  const completion = await client.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content:
          "You are a professional resume writer. Create compelling, concise summaries that highlight achievements and skills.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    response_format: { type: "json_object" },
    temperature: LLM.TEMPERATURE.CREATIVE,
  })

  const content = completion.choices[0].message.content || "{}"
  return JSON.parse(content)
}

/**
 * Compare existing resume with new contributions
 */
export async function compareResumeWithContributions(
  apiKey: string,
  params: {
    existingResume: string
    contributions: GitHubContributionData
  },
  model: string = LLM.DEFAULT_MODEL
): Promise<{
  missingAchievements: string[]
  outdatedSections: string[]
  suggestions: string[]
}> {
  const client = createOpenAIClient(apiKey)
  const { existingResume, contributions } = params

  const prompt = `Compare this existing resume with recent GitHub contributions to identify gaps and improvements.

EXISTING RESUME:
${existingResume}

GITHUB CONTRIBUTIONS:
- Repositories: ${contributions.repositories.length}
- Recent commits: ${contributions.commits
    .slice(0, LLM.MAX_REPOS_IN_PROMPT)
    .map((c) => c.message)
    .join("; ")}
- Pull requests: ${contributions.pullRequests.length}
- Issues: ${contributions.issues.length}

Analyze and identify:
1. Missing achievements from GitHub that should be added
2. Outdated sections that need updating
3. Specific suggestions for improvement

Return as JSON:
{
  "missingAchievements": ["achievement 1", "achievement 2"],
  "outdatedSections": ["section 1", "section 2"],
  "suggestions": ["suggestion 1", "suggestion 2"]
}`

  const completion = await client.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content:
          "You are a resume optimization expert. Identify gaps between resumes and actual work to improve accuracy and impact.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    response_format: { type: "json_object" },
    temperature: LLM.TEMPERATURE.ANALYSIS,
  })

  const content = completion.choices[0].message.content || "{}"
  return JSON.parse(content)
}

/**
 * Estimate token usage for a given text
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length * LLM.TOKENS_PER_CHAR)
}
