import { z } from "zod"

// GitHub token schema
export const githubTokenSchema = z.object({
  token: z
    .string()
    .min(1, "GitHub token is required")
    .startsWith("ghp_", "Must be a valid GitHub Personal Access Token"),
})

export type GitHubTokenFormData = z.infer<typeof githubTokenSchema>

// OpenAI key schema
export const openaiKeySchema = z.object({
  apiKey: z
    .string()
    .min(1, "OpenAI API key is required")
    .startsWith("sk-", "Must be a valid OpenAI API key"),
})

export type OpenAIKeyFormData = z.infer<typeof openaiKeySchema>

// Resume upload schema
export const resumeSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 2 * 1024 * 1024, "File size must be less than 2MB")
    .refine(
      (file) =>
        ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"].includes(
          file.type
        ),
      "File must be PDF, DOCX, or TXT"
    ),
})

export type ResumeFormData = z.infer<typeof resumeSchema>

// Legacy schema for backwards compatibility
export const onboardingSchema = z.object({
  githubToken: z.string().min(1),
  openaiKey: z.string().min(1),
  resume: z.instanceof(File),
})
