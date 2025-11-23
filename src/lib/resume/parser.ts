import mammoth from "mammoth"
import { extractText } from "unpdf"
import type { ResumeContent } from "@/lib/db/types"

export async function parsePDF(buffer: Buffer): Promise<string> {
  try {
    const uint8Array = new Uint8Array(buffer)
    const { text } = await extractText(uint8Array, { mergePages: true })
    return text
  } catch (error) {
    console.error("PDF parsing error:", error)
    throw new Error("Failed to parse PDF file. Please ensure it's a valid PDF document.")
  }
}

export async function parseDOCX(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer })
  return result.value
}

export function parseTXT(buffer: Buffer): string {
  return buffer.toString("utf-8")
}

export function extractResumeSections(text: string): ResumeContent {
  const content: ResumeContent = {
    experience: [],
    projects: [],
    skills: [],
    education: [],
  }

  // Normalize text for better parsing
  const normalizedText = text.replace(/\r\n/g, "\n")
  const lines = normalizedText.split("\n").filter((line) => line.trim())

  // Simple section detection (can be enhanced with AI later)
  let currentSection: keyof ResumeContent | null = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    const lowerLine = line.toLowerCase()

    // Detect section headers with early continues
    if (
      lowerLine.includes("summary") ||
      lowerLine.includes("profile") ||
      lowerLine.includes("about")
    ) {
      content.summary = line
      continue
    }

    if (
      lowerLine.includes("experience") ||
      lowerLine.includes("work history") ||
      lowerLine.includes("employment")
    ) {
      currentSection = "experience"
      continue
    }

    if (lowerLine.includes("project") || lowerLine.includes("portfolio")) {
      currentSection = "projects"
      continue
    }

    if (
      lowerLine.includes("skill") ||
      lowerLine.includes("technical") ||
      lowerLine.includes("technologies")
    ) {
      currentSection = "skills"
      continue
    }

    if (lowerLine.includes("education") || lowerLine.includes("academic")) {
      currentSection = "education"
      continue
    }

    // Add content to current section - early returns for each case
    if (!currentSection || line.length === 0) {
      continue
    }

    if (currentSection === "skills") {
      const skills = line.split(/[,;•·]/).map((s) => s.trim()).filter(Boolean)
      content.skills = [...(content.skills || []), ...skills]
      continue
    }

    if (currentSection === "experience") {
      content.experience = content.experience || []
      const isJobLine =
        line.match(/\b(developer|engineer|designer|manager|analyst|lead)\b/i) ||
        line.match(/\b(inc\.|llc|corp|company)\b/i)
      
      if (isJobLine) {
        content.experience.push({
          company: line,
          position: lines[i + 1] || "",
          startDate: "",
          description: "",
        })
      }
      continue
    }

    if (currentSection === "projects") {
      content.projects = content.projects || []
      const isProjectTitle = line.match(/^[A-Z]/) && line.length > 10
      
      if (isProjectTitle) {
        content.projects.push({
          name: line,
          description: lines[i + 1] || "",
        })
      }
      continue
    }

    if (currentSection === "education") {
      content.education = content.education || []
      const isEducationLine =
        line.match(/\b(university|college|school|institute)\b/i) ||
        line.match(/\b(bachelor|master|phd|associate|degree)\b/i)
      
      if (isEducationLine) {
        content.education.push({
          institution: line,
          degree: lines[i + 1] || "",
        })
      }
      continue
    }
  }

  return content
}

export async function parseResumeFile(
  buffer: Buffer,
  fileType: string
): Promise<{ text: string; content: ResumeContent }> {
  const normalizedType = fileType.toLowerCase()

  // Early returns for each file type
  if (normalizedType === "pdf" || normalizedType === "application/pdf") {
    const text = await parsePDF(buffer)
    const content = extractResumeSections(text)
    return { text, content }
  }

  if (
    normalizedType === "docx" ||
    normalizedType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const text = await parseDOCX(buffer)
    const content = extractResumeSections(text)
    return { text, content }
  }

  if (normalizedType === "txt" || normalizedType === "text/plain") {
    const text = parseTXT(buffer)
    const content = extractResumeSections(text)
    return { text, content }
  }

  throw new Error(`Unsupported file type: ${fileType}`)
}

