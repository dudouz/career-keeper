import type { AnalysisContext, Seniority, Role, Objective } from "./context-types";

/**
 * Dynamic Prompt Templates System
 * Adapts prompts based on user context (seniority, role, objective)
 */

// ============================================================================
// STEP 1: EXTRACTION & SUMMARY
// ============================================================================

function getSeniorityGuidance(seniority: Seniority): string {
  const guidance = {
    junior: "Focus on learning, growth, and hands-on implementation. Highlight contributions to features and bug fixes.",
    mid: "Focus on independent feature delivery, code quality, and cross-team collaboration. Highlight technical decision-making.",
    senior: "Focus on architectural decisions, mentorship, system design, and technical leadership. Highlight impact on team velocity and code quality.",
    staff: "Focus on org-wide technical strategy, cross-team initiatives, and long-term technical vision. Highlight influence beyond immediate team.",
    principal: "Focus on company-wide technical direction, setting standards, and influencing engineering culture. Highlight strategic impact.",
    lead: "Focus on team management, delivery, stakeholder communication, and people development. Highlight both technical and leadership contributions.",
  };
  return guidance[seniority];
}

function getRoleFocus(role: Role): string {
  const focus = {
    backend: "server-side logic, APIs, databases, performance, scalability, and infrastructure",
    frontend: "UI/UX, user interactions, component design, accessibility, and client-side performance",
    fullstack: "end-to-end feature delivery, both client and server architecture, and system integration",
    devops: "infrastructure, CI/CD, deployment automation, monitoring, and system reliability",
    mobile: "mobile app development, platform-specific features, performance, and user experience",
    data: "data pipelines, ETL processes, data modeling, and analytics infrastructure",
    ml: "machine learning models, data processing, model deployment, and ML infrastructure",
    security: "security practices, vulnerability fixes, authentication, authorization, and compliance",
  };
  return focus[role];
}

function getObjectiveGuidance(objective: Objective): string {
  const guidance = {
    job_application:
      "Emphasize achievements that match the target role. Use metrics, impact statements, and industry-standard terminology. Highlight transferable skills and relevant technologies.",
    promotion:
      "Demonstrate growth beyond current level. Show leadership, initiative, and expanding scope of impact. Highlight how you've operated at the next level already.",
    year_review:
      "Provide comprehensive view of contributions over the year. Include both successes and learnings. Show progression and value delivered to the organization.",
    portfolio:
      "Showcase technical depth and breadth. Highlight interesting problems solved, technologies mastered, and creative solutions implemented.",
    general:
      "Provide balanced, factual analysis of technical contributions. Focus on what was built and the technologies used.",
    linkedin:
      "Use engaging, professional tone. Focus on achievements that demonstrate expertise and thought leadership. Make it scannable and compelling.",
    resume_update:
      "Use action verbs and quantifiable achievements. Keep it concise and impactful. Follow resume best practices (STAR method).",
    salary_negotiation:
      "Quantify impact with metrics (performance improvements, cost savings, user growth). Highlight complex problems solved and value delivered to business.",
  };
  return guidance[objective];
}

export function generateStep1SystemPrompt(context: AnalysisContext): string {
  const seniorityLevel = context.seniority.charAt(0).toUpperCase() + context.seniority.slice(1);
  const roleTitle = context.role.charAt(0).toUpperCase() + context.role.slice(1);

  return `You are an expert ${seniorityLevel} ${roleTitle} Engineer specializing in Code Review and Change Analysis.

Your goal is to parse raw Git Diffs and Commit Messages to extract a factual, technical summary of the changes.

Context:
- Analyzing contributions from a ${seniorityLevel} ${roleTitle} developer
- Analysis purpose: ${context.objective.replace(/_/g, " ")}
${context.targetJobTitle ? `- Target role: ${context.targetJobTitle}` : ""}
${context.yearsOfExperience ? `- Years of experience: ${context.yearsOfExperience}` : ""}

Guidance:
${getSeniorityGuidance(context.seniority)}

Focus areas for ${roleTitle} role:
${getRoleFocus(context.role)}

Analysis objective:
${getObjectiveGuidance(context.objective)}

You do not judge quality yet; you only identify **what** changed functionally.`;
}

export function generateStep1UserPrompt(
  context: AnalysisContext,
  retrievedContext: string,
  commitMessages: string,
  rawDiff: string
): string {
  return `# Context
We are analyzing contributions from a ${context.seniority} ${context.role} developer.
${context.targetJobTitle ? `Target position: ${context.targetJobTitle}` : ""}
${context.targetCompany ? `Target company: ${context.targetCompany}` : ""}
${context.customInstructions ? `\nAdditional context: ${context.customInstructions}` : ""}

Purpose: ${context.objective.replace(/_/g, " ")}

# Input Data
- **Context (RAG):** ${retrievedContext}
- **Commit Messages:** ${commitMessages}
- **Raw Diff:** ${rawDiff}

# Instructions
1. **Filter Noise:** Ignore purely cosmetic changes (whitespace, formatting) unless they are massive.
2. **Identify Scope:** Group changes by logical component (e.g., "Authentication Module", "Payment UI").
3. **Analyze Tests:** If test files were modified, describe strictly what scenario is being tested.
4. **Dependency Check:** List any new libraries or packages added to \`package.json\` (or equivalent).
5. **Impact Focus:** Given this is for ${context.objective.replace(/_/g, " ")}, emphasize ${getObjectiveGuidance(context.objective)}

# Output Format (Strict JSON)
{
  "summary_high_level": "A single sentence summarizing the overall goal of this contribution.",
  "changes": [
    {
      "file_path": "path/to/file",
      "change_type": "CREATE | UPDATE | DELETE | REFACTOR",
      "technical_description": "A precise explanation of the logic change (e.g., 'Added input validation for email field')."
    }
  ],
  "new_dependencies": ["list", "of", "packages"],
  "rag_utilization": "Briefly explain if the RAG context helped understand a specific internal function or module."
}`;
}

// ============================================================================
// STEP 2: PATTERN RECOGNITION & REASONING
// ============================================================================

export function generateStep2SystemPrompt(context: AnalysisContext): string {
  const level =
    context.seniority === "principal" || context.seniority === "staff"
      ? "Distinguished"
      : "Principal";

  return `You are a ${level} Software Architect.

Your goal is to analyze a pre-processed summary of code changes and identify the underlying engineering decisions, design patterns, and technology stack usage.

Context:
- Analyzing contributions from a ${context.seniority}-level ${context.role} engineer
- Analysis purpose: ${context.objective.replace(/_/g, " ")}
${context.targetJobTitle ? `- Target role: ${context.targetJobTitle}` : ""}

Expectations for ${context.seniority} level:
${getSeniorityGuidance(context.seniority)}

Focus on ${context.role} expertise:
${getRoleFocus(context.role)}`;
}

export function generateStep2UserPrompt(
  context: AnalysisContext,
  step1Output: string,
  keySnippets: string
): string {
  return `# Task
Analyze the functional summary provided below to determine the architectural intent.
Look for standard Design Patterns (GoF, Enterprise Patterns) and specific framework patterns (e.g., React Hooks, NestJS Guards).

Context: This analysis is for ${context.objective.replace(/_/g, " ")}.
${context.targetJobTitle ? `The developer is targeting: ${context.targetJobTitle}` : ""}
${context.customInstructions ? `Additional context: ${context.customInstructions}` : ""}

# Input Data
- **Functional Summary (from Step 1):** ${step1Output}
- **Key Code Snippets (Optional):** ${keySnippets}

# Reasoning Guidelines (Chain of Thought)
Please think step-by-step before generating the JSON:
1. **Abstraction Level:** Did the user create a new abstraction? Why? (e.g., to decouple logic).
2. **Pattern Matching:** Does the code resemble a known pattern (Singleton, Factory, Strategy, Observer, Repository, etc.)?
3. **Tech Stack Role:** How are specific technologies (e.g., Redis, Tailwind, Docker) being utilized in this specific context?
4. **Trade-offs:** Identify if there were visible trade-offs (e.g., "Used a quick fix instead of a full refactor").
5. **Seniority Alignment:** Does this demonstrate ${context.seniority}-level thinking? ${getSeniorityGuidance(context.seniority)}

# Output Format (Strict JSON)
{
  "tech_stack_utilized": [
    {"name": "Technology Name", "purpose": "How it was used in this diff"}
  ],
  "design_patterns": [
    {
      "name": "Pattern Name (e.g., Factory Pattern)",
      "confidence": "High/Medium/Low",
      "justification": "Why you believe this pattern was applied based on the code evidence."
    }
  ],
  "key_decisions": [
    "Decision to migrate state management from Redux to Context API.",
    "Implementation of a retry mechanism for external API calls."
  ],
  "architectural_impact": "Assessment of how this contribution affects the system (e.g., Improves modularity, Increases coupling)."
}`;
}

// ============================================================================
// STEP 3: FINAL REPORTING
// ============================================================================

export function generateStep3SystemPrompt(context: AnalysisContext): string {
  const tone = {
    job_application: "compelling and achievement-focused",
    promotion: "leadership-oriented and impact-driven",
    year_review: "comprehensive and balanced",
    portfolio: "engaging and technically deep",
    general: "professional and objective",
    linkedin: "engaging and personal brand-focused",
    resume_update: "concise and action-oriented",
    salary_negotiation: "metrics-driven and value-focused",
  };

  return `You are a Technical Writer and Developer Advocate specializing in ${context.objective.replace(/_/g, " ")}.

Your goal is to transform complex architectural JSON data into a clean, engaging, and professional contribution report.

Context:
- Developer level: ${context.seniority}
- Role: ${context.role}
- Purpose: ${context.objective.replace(/_/g, " ")}
${context.targetJobTitle ? `- Target position: ${context.targetJobTitle}` : ""}
${context.targetCompany ? `- Target company: ${context.targetCompany}` : ""}

Tone: ${tone[context.objective]}, yet appreciative of the work done.`;
}

export function generateStep3UserPrompt(
  context: AnalysisContext,
  step1Output: string,
  step2Output: string
): string {
  const formatGuidance = {
    job_application:
      "Use bullet points with quantifiable achievements. Start each with strong action verbs. Highlight skills that match the target role.",
    promotion:
      "Structure around impact themes (Technical Leadership, Team Impact, Business Value). Show progression and operating at next level.",
    year_review:
      "Organize by quarters or themes. Include both wins and learnings. Show growth trajectory.",
    portfolio:
      "Lead with the most impressive technical achievement. Include architecture diagrams concepts if relevant. Tell a story.",
    general: "Balanced technical overview with clear sections for technologies, patterns, and changes.",
    linkedin:
      "Hook with the most impressive stat. Use first person. Make it skimmable with emojis and short paragraphs.",
    resume_update:
      "Follow STAR format (Situation, Task, Action, Result). Keep bullet points to 1-2 lines. Use metrics.",
    salary_negotiation:
      "Lead with business impact metrics. Quantify everything. Show unique value delivered.",
  };

  return `# Context
We need a report for a ${context.seniority} ${context.role} developer for ${context.objective.replace(/_/g, " ")}.
${context.targetJobTitle ? `Target role: ${context.targetJobTitle}` : ""}
${context.targetCompany ? `Target company: ${context.targetCompany}` : ""}
${context.customInstructions ? `\nAdditional context: ${context.customInstructions}` : ""}

# Input Data
- **Functional Data:** ${step1Output}
- **Architectural Analysis:** ${step2Output}

# Formatting Rules
- Use Markdown.
- Tone: ${context.objective === "linkedin" ? "Engaging, personal, first-person" : "Professional, objective, yet appreciative of the work done"}.
- ${context.objective === "linkedin" ? "Use emojis strategically to highlight sections." : "Use emojis sparingly to highlight sections."}
- **Do not** simply dump the JSON. Synthesize the information into paragraphs and bullet points.
- ${formatGuidance[context.objective]}

# Desired Output Structure
${context.objective === "job_application" || context.objective === "resume_update" ? `
## Key Achievements
- **[Achievement 1]:** [Metric-driven result]
- **[Achievement 2]:** [Metric-driven result]

## Technical Skills Demonstrated
- **[Tech Category]:** [Technologies used with context]

## Impact
[Business/technical impact paragraph]
` : context.objective === "linkedin" ? `
🚀 [Hook - Most impressive achievement]

[2-3 paragraph story of what you built and why it matters]

💡 Key Technologies:
• [Tech 1]
• [Tech 2]

📊 Impact:
• [Metric 1]
• [Metric 2]

#hashtags #relevant #totherole
` : `
## 📦 Contribution Overview
[A concise summary of what was achieved]

## 🛠️ Tech Stack & Tools
- **[Tech Name]:** [Brief usage description]

## 🏗️ Architecture & Patterns
> [Highlight the most interesting architectural decision here as a blockquote]
- **[Pattern Name]:** [Explanation]

## 📋 Detailed Changes
- [Bullet points of functional changes]
`}

---
*Report generated by AI Architect*`;
}
