import OpenAI from "openai"
import type { GitHubContributionData } from "@/lib/db/types"

export interface LLMClientConfig {
  apiKey: string
  model?: string
}

// TODO: Not sure if we need a class, we can have some hooks for each method and leverage react query instead...
// TODO: We also have some magic numbers, we should use a more consistent approach.

export class LLMClient {
  private client: OpenAI
  private model: string

  constructor(config: LLMClientConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
    })
    this.model = config.model || "gpt-4-turbo-preview"
  }

  /**
   * Analyze GitHub contributions and extract resume-worthy achievements
   */
  async analyzeContributions(contributions: GitHubContributionData): Promise<{
    achievements: string[]
    skills: string[]
    projects: Array<{ name: string; description: string; highlights: string[] }>
  }> {
    const prompt = `Analyze the following GitHub contributions and extract resume-worthy achievements, skills, and project highlights.

Repositories: ${contributions.repositories.length}
Commits: ${contributions.commits.length}
Pull Requests: ${contributions.pullRequests.length}
Issues: ${contributions.issues.length}

Top repositories:
${contributions.repositories
  .slice(0, 5)
  .map((r) => `- ${r.name}: ${r.description || "No description"}`)
  .join("\n")}

Recent commits:
${contributions.commits
  .slice(0, 10)
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

    const completion = await this.client.chat.completions.create({
      model: this.model,
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
      temperature: 0.7,
    })

    const content = completion.choices[0].message.content || "{}"
    return JSON.parse(content)
  }

  /**
   * Generate a professional summary from contributions and resume
   */
  async generateSummary(params: {
    contributions: GitHubContributionData
    currentSummary?: string
    tone?: "technical" | "leadership" | "hybrid"
  }): Promise<{
    summary: string
    alternatives: string[]
  }> {
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
      .slice(0, 10)
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

    const completion = await this.client.chat.completions.create({
      model: this.model,
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
      temperature: 0.8,
    })

    const content = completion.choices[0].message.content || "{}"
    return JSON.parse(content)
  }

  /**
   * Compare existing resume with new contributions
   */
  async compareResumeWithContributions(params: {
    existingResume: string
    contributions: GitHubContributionData
  }): Promise<{
    missingAchievements: string[]
    outdatedSections: string[]
    suggestions: string[]
  }> {
    const { existingResume, contributions } = params

    const prompt = `Compare this existing resume with recent GitHub contributions to identify gaps and improvements.

EXISTING RESUME:
${existingResume}

GITHUB CONTRIBUTIONS:
- Repositories: ${contributions.repositories.length}
- Recent commits: ${contributions.commits
      .slice(0, 5)
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

    const completion = await this.client.chat.completions.create({
      model: this.model,
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
      temperature: 0.7,
    })

    const content = completion.choices[0].message.content || "{}"
    return JSON.parse(content)
  }

  /**
   * Estimate token usage for a given text
   */
  estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4)
  }
}
