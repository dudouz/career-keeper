import mammoth from "mammoth"
import { extractText } from "unpdf"

// New structured types for parsed resume
export interface ParsedResumeHeader {
  name: string
  email: string
  phone?: string
  git?: string
  linkedin?: string
  website?: string
}

export interface ParsedResumeSection {
  start: string // YYYY-MM format
  end?: string // YYYY-MM format or null for current
  position: string
  company: string
  description: string
  displayOrder: number
}

export interface ParsedResume {
  header: ParsedResumeHeader
  summary: string
  sections: ParsedResumeSection[]
  rawContent: string
}

// Text extraction by file type
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

// Header extraction
export function extractHeader(text: string): ParsedResumeHeader {
  const lines = text.split("\n").filter((line) => line.trim())

  // Email - most reliable identifier
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/
  const emailMatch = text.match(emailRegex)
  const email = emailMatch ? emailMatch[1] : ""

  // Phone - multiple formats
  const phoneRegex = /(\+?1?\s*\(?[0-9]{3}\)?[\s.-]?[0-9]{3}[\s.-]?[0-9]{4})/
  const phoneMatch = text.match(phoneRegex)
  const phone = phoneMatch ? phoneMatch[1].trim() : undefined

  // GitHub
  const gitRegex = /(https?:\/\/)?(www\.)?github\.com\/[\w-]+/i
  const gitMatch = text.match(gitRegex)
  let git = gitMatch ? gitMatch[0] : undefined
  if (git && !git.startsWith("http")) {
    git = `https://${git}`
  }

  // LinkedIn
  const linkedinRegex = /(https?:\/\/)?(www\.)?linkedin\.com\/in\/[\w-]+/i
  const linkedinMatch = text.match(linkedinRegex)
  let linkedin = linkedinMatch ? linkedinMatch[0] : undefined
  if (linkedin && !linkedin.startsWith("http")) {
    linkedin = `https://${linkedin}`
  }

  // Website - generic URL (exclude github/linkedin/email domains)
  const websiteRegex = /(https?:\/\/)?(www\.)?[\w-]+\.[\w.-]+/gi
  const urls = text.match(websiteRegex) || []
  const emailDomain = email.split("@")[1] || ""
  const website = urls.find(
    (url) =>
      !url.includes("github.com") &&
      !url.includes("linkedin.com") &&
      !url.includes(emailDomain) &&
      url.length > 5
  )

  // Name - heuristic: first reasonable line that looks like a name
  let name = ""

  // Helper to extract name from a line (removes URLs, emails, etc.)
  const extractNameFromLine = (line: string): string => {
    let cleaned = line.trim()

    // Remove URLs (http://, https://, www.)
    cleaned = cleaned.replace(/https?:\/\/[^\s]+/gi, "")
    cleaned = cleaned.replace(/www\.[^\s]+/gi, "")

    // Remove email addresses
    cleaned = cleaned.replace(/[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+/g, "")

    // Remove pipe separators and everything after
    cleaned = cleaned.split("|")[0].trim()

    // Remove common separators like " - " if followed by job title
    // Pattern: "Name - Job Title" -> extract just "Name"
    const nameTitleMatch = cleaned.match(/^(.+?)\s*[-–—]\s*(.+)$/)
    if (nameTitleMatch) {
      const potentialName = nameTitleMatch[1].trim()
      const potentialTitle = nameTitleMatch[2].trim()
      // If the part after dash looks like a job title (contains common job words), take only the name part
      if (
        potentialTitle.match(
          /\b(engineer|developer|manager|director|analyst|designer|specialist|consultant|architect|lead|senior|junior|front|back|end|full|stack)\b/i
        )
      ) {
        cleaned = potentialName
      }
    }

    return cleaned.trim()
  }

  // Helper to validate if a line looks like a name
  const isValidName = (line: string): boolean => {
    const trimmed = extractNameFromLine(line)
    // Must be between 2 and 100 characters
    if (trimmed.length < 2 || trimmed.length > 100) return false
    // Should not be all caps (likely a header)
    if (trimmed.match(/^[A-Z\s]{20,}$/)) return false
    // Should not contain "resume" or similar
    if (trimmed.match(/resume|cv|curriculum/i)) return false
    // Should not be a URL (should already be removed, but double-check)
    if (trimmed.match(/https?:\/\//i)) return false
    // Should not contain email pattern (should already be removed, but double-check)
    if (trimmed.match(/@/)) return false
    // Should not be mostly numbers or special chars
    if (trimmed.match(/^[\d\s\-\(\)]+$/)) return false
    // Should contain at least one letter
    if (!trimmed.match(/[a-zA-Z]/)) return false
    // Should be 1-5 words (reasonable name length)
    const wordCount = trimmed.split(/\s+/).filter((w) => w.length > 0).length
    if (wordCount < 1 || wordCount > 5) return false
    return true
  }

  if (emailMatch) {
    // If email found, look for name before email
    const emailIndex = text.indexOf(emailMatch[0])
    const beforeEmail = text.substring(0, emailIndex)
    const nameLines = beforeEmail.split("\n").filter(isValidName)
    // Take the FIRST valid name line (most likely to be the actual name)
    if (nameLines.length > 0) {
      name = extractNameFromLine(nameLines[0])
    }
  }

  // If no name found yet, try first few lines of the document
  if (!name) {
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      if (isValidName(lines[i])) {
        name = extractNameFromLine(lines[i])
        break
      }
    }
  }

  // Final fallback: extract name from first line even if it contains URLs
  if (!name && lines.length > 0) {
    const firstLine = lines[0].trim()
    if (firstLine.length > 0 && firstLine.match(/[a-zA-Z]/)) {
      const extracted = extractNameFromLine(firstLine)
      // Validate the extracted portion
      if (extracted.length >= 2 && extracted.length <= 100) {
        const wordCount = extracted.split(/\s+/).filter((w) => w.length > 0).length
        if (wordCount >= 1 && wordCount <= 5 && !extracted.match(/^[A-Z\s]{20,}$/)) {
          name = extracted
        }
      }
    }
  }

  // Final safety: ensure name is reasonable length and properly formatted
  if (name) {
    name = name.trim()
    // Limit to 100 characters max
    if (name.length > 100) {
      name = name.substring(0, 100).trim()
    }
    // Limit to 5 words max
    const words = name.split(/\s+/)
    if (words.length > 5) {
      name = words.slice(0, 5).join(" ").trim()
    }
  }

  return {
    name: name || "",
    email,
    phone,
    git,
    linkedin,
    website,
  }
}

// Summary extraction
export function extractSummary(text: string): string {
  // Summary typically appears after header and before experience
  // Common headers: "Summary", "Professional Summary", "Profile", "About", "Objective"

  const summaryRegex = /(?:summary|profile|about|objective|professional summary)[\s:]*\n/i
  const summaryMatch = text.match(summaryRegex)

  let startIndex: number
  let summaryText: string = ""

  if (summaryMatch) {
    // Explicit summary section found
    startIndex = text.indexOf(summaryMatch[0]) + summaryMatch[0].length
  } else {
    // No explicit summary header - look for descriptive text before "Work Experience"
    // Find the first occurrence of experience section
    // Match phrase patterns first (more specific), then standalone "Experience" as header
    // Use word boundaries to avoid matching "experience" within the summary text
    const experienceRegex =
      /\b(?:work\s+experience|employment|work\s+history|professional\s+experience)\b|(?:^|\n)\s*experience\b/i
    const experienceMatch = text.match(experienceRegex)

    if (!experienceMatch) {
      return ""
    }

    // Look for text between header info (URLs, name) and experience section
    // Typically 2-3 sentences describing the person
    const experienceIndex = text.indexOf(experienceMatch[0])

    // Find where header info ends (after URLs, typically)
    // Look for URLs and pipe separators
    const urlPattern = /(?:https?:\/\/[^\s]+|www\.[^\s]+)/gi
    const urls = [...text.matchAll(urlPattern)]
    const pipePattern = /\s*\|\s*/g
    const pipes = [...text.matchAll(pipePattern)]

    // Find the last URL or pipe separator before experience section
    let lastSeparatorIndex = 0
    if (urls.length > 0) {
      const lastUrl = urls[urls.length - 1]
      lastSeparatorIndex = lastUrl.index! + lastUrl[0].length
    }
    if (pipes.length > 0) {
      const lastPipe = pipes[pipes.length - 1]
      if (lastPipe.index! > lastSeparatorIndex && lastPipe.index! < experienceIndex) {
        lastSeparatorIndex = lastPipe.index! + lastPipe[0].length
      }
    }

    // Start after the last separator, extract text up to experience section
    startIndex = lastSeparatorIndex
    let candidateText = text.substring(startIndex, experienceIndex).trim()

    // Remove any remaining URLs or separators from the candidate text
    candidateText = candidateText
      .replace(/https?:\/\/[^\s]+/gi, "")
      .replace(/www\.[^\s]+/gi, "")
      .replace(/\s*\|\s*/g, " ")
      .trim()

    // The summary text might be on the same line as URLs, so we need to extract it carefully
    // Look for text that looks like a professional summary (starts with capital, contains descriptive words)
    // Split by "Work Experience" if it appears in the text
    if (candidateText.includes("Work Experience")) {
      const parts = candidateText.split(/Work\s+Experience/i)
      if (parts[0]) {
        candidateText = parts[0].trim()
      }
    }

    // Clean up extra whitespace
    candidateText = candidateText.replace(/\s+/g, " ").trim()

    // If there's substantial text (more than 50 chars), treat it as summary
    if (candidateText.length >= 50) {
      summaryText = candidateText
    }
  }

  // Find where summary ends (next section)
  // Use word boundaries to avoid matching words within the summary text
  const nextSectionRegex = /\b(?:work\s+experience|employment|education|skills|work\s+history)\b/i
  const nextSectionMatch = text.substring(startIndex).match(nextSectionRegex)

  const endIndex = nextSectionMatch
    ? startIndex + text.substring(startIndex).indexOf(nextSectionMatch[0])
    : startIndex + 500 // Max 500 chars if no clear end

  if (!summaryText) {
    summaryText = text.substring(startIndex, endIndex).trim()
  } else {
    // Limit to endIndex if we found it
    if (summaryText.length > endIndex - startIndex) {
      summaryText = summaryText.substring(0, endIndex - startIndex).trim()
    }
  }

  // Clean up - remove URLs and extra whitespace
  summaryText = summaryText
    .replace(/https?:\/\/[^\s]+/gi, "")
    .replace(/www\.[^\s]+/gi, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()

  return summaryText.substring(0, 1000) // Max length
}

// Date normalization
function normalizeDate(dateStr: string): string {
  // Input could be: "2023", "Jan 2023", "01/2023", "January 2023", "November 2024"
  // Output should be: "YYYY-MM"

  // Clean up the string
  dateStr = dateStr.trim()

  const yearOnly = dateStr.match(/^(\d{4})$/)
  if (yearOnly) {
    return `${yearOnly[1]}-01` // Default to January
  }

  // Match "Month YYYY" or "Mon YYYY"
  const monthYear = dateStr.match(/(\w+)\s+(\d{4})/)
  if (monthYear) {
    const month = parseMonth(monthYear[1])
    return `${monthYear[2]}-${month.toString().padStart(2, "0")}`
  }

  const numericDate = dateStr.match(/(\d{1,2})\/(\d{4})/)
  if (numericDate) {
    return `${numericDate[2]}-${numericDate[1].padStart(2, "0")}`
  }

  return dateStr
}

function parseMonth(monthStr: string): number {
  const months: Record<string, number> = {
    jan: 1,
    january: 1,
    feb: 2,
    february: 2,
    mar: 3,
    march: 3,
    apr: 4,
    april: 4,
    may: 5,
    jun: 6,
    june: 6,
    jul: 7,
    july: 7,
    aug: 8,
    august: 8,
    sep: 9,
    sept: 9,
    september: 9,
    oct: 10,
    october: 10,
    nov: 11,
    november: 11,
    dec: 12,
    december: 12,
  }

  return months[monthStr.toLowerCase()] || 1
}

// Parse position and company from a line
function parsePositionCompany(line: string, section: Partial<ParsedResumeSection>): void {
  // Remove leading markers like ">"
  line = line.replace(/^>\s*/, "").trim()

  // Remove date and location parts (anything after " - " that contains a year or "Present")
  // Example: "Thaloz Technologies – Senior Front-end Developer - November 2024 – Present | Uruguay"
  // Match patterns like: " - November 2024 – Present | Location" or " - 2024 - 2025 | Location"
  // First, try to match full date pattern with month: " - Month YYYY – Present/End"
  // Note: Order matters - check for "present/current" first in the alternation
  const fullDatePattern = /\s+-\s+\w+\s+\d{4}\s*[–—]\s*(?:present|current|\w+\s+\d{4}|\d{4}).*$/i
  // Then try simple date pattern: " - YYYY – YYYY/Present"
  const simpleDatePattern = /\s+-\s+\d{4}\s*[–—]\s*(?:present|current|\d{4}).*$/i

  if (line.match(fullDatePattern)) {
    line = line.replace(fullDatePattern, "").trim()
  } else if (line.match(simpleDatePattern)) {
    line = line.replace(simpleDatePattern, "").trim()
  }

  // Also remove location patterns at the end (e.g., "| Uruguay")
  const locationPattern = /\s*\|\s*[^|]+$/i
  line = line.replace(locationPattern, "").trim()

  // Try different patterns:
  // "Company – Position" (em-dash/en-dash)
  // "Senior Developer at Google"
  // "Senior Developer | Google"
  // "Senior Developer, Google"
  // "Google - Senior Developer"

  const emDashPattern = /(.+?)\s*[–—]\s*(.+)/ // Em-dash or en-dash
  const atPattern = /(.+?)\s+at\s+(.+)/i
  const pipePattern = /(.+?)\s*\|\s*(.+)/
  const commaPattern = /(.+?),\s*(.+)/
  const dashPattern = /(.+?)\s*-\s*(.+)/ // Regular dash

  let match

  // Try em-dash first (common in formatted resumes)
  if ((match = line.match(emDashPattern))) {
    const part1 = match[1].trim()
    const part2 = match[2].trim()

    // If part1 has company indicators, it's company first
    if (part1.match(/\b(inc|llc|corp|ltd|co|technologies|tech|systems)\b/i)) {
      section.company = part1
      section.position = part2
    } else {
      // Otherwise assume company comes first in professional resumes
      section.company = part1
      section.position = part2
    }
  } else if ((match = line.match(atPattern))) {
    section.position = match[1].trim()
    section.company = match[2].trim()
  } else if ((match = line.match(pipePattern))) {
    section.position = match[1].trim()
    section.company = match[2].trim()
  } else if ((match = line.match(commaPattern))) {
    section.position = match[1].trim()
    section.company = match[2].trim()
  } else if ((match = line.match(dashPattern))) {
    // Could be either way, use heuristic
    const part1 = match[1].trim()
    const part2 = match[2].trim()

    // If part1 has "Inc", "LLC", "Corp", it's probably company
    if (part1.match(/\b(inc|llc|corp|ltd|co|technologies|tech|systems)\b/i)) {
      section.company = part1
      section.position = part2
    } else {
      section.position = part1
      section.company = part2
    }
  } else {
    // Just one line - could be position or company
    // Use heuristic: if it has company indicators, it's company
    if (line.match(/\b(inc|llc|corp|ltd|co|technologies|tech|systems)\b/i)) {
      section.company = line
    } else {
      section.position = line
    }
  }
}

// Section extraction (work experience)
export function extractSections(text: string): ParsedResumeSection[] {
  const sections: ParsedResumeSection[] = []

  // 1. Find the experience section
  // Match phrase patterns first (more specific), then standalone "Experience" as header
  // Use word boundaries and line start patterns to avoid matching "experience" within summary text
  const experienceRegex =
    /\b(?:work\s+experience|employment|work\s+history|professional\s+experience)\b|(?:^|\n)\s*experience\b/i
  const experienceMatch = text.match(experienceRegex)

  if (!experienceMatch) {
    return sections
  }

  const startIndex = text.indexOf(experienceMatch[0])

  // Find end of experience section (next major section)
  // Use word boundaries to avoid matching words within descriptions
  const nextSectionRegex = /\b(?:education|skills|projects|certifications|awards)\b/i
  const nextSectionMatch = text.substring(startIndex).match(nextSectionRegex)
  const endIndex = nextSectionMatch
    ? startIndex + text.substring(startIndex).indexOf(nextSectionMatch[0])
    : text.length

  const experienceText = text.substring(startIndex, endIndex)

  // 2. Split into individual job entries
  // Handle both newline-separated and single-line formats
  let lines: string[]
  if (experienceText.includes("\n")) {
    // Multi-line format
    lines = experienceText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
  } else {
    // Single-line format - split by "> " pattern which indicates new entries
    lines = experienceText
      .split(/>\s+/)
      .map((l) => l.trim())
      .filter(Boolean)
    // Add ">" back to entries that were split (except the first one if it's the section header)
    for (let i = 0; i < lines.length; i++) {
      if (i === 0 && lines[i].match(experienceRegex)) {
        // Skip section header
        continue
      }
      // Add ">" prefix to indicate it's a new entry
      if (!lines[i].startsWith(">")) {
        lines[i] = "> " + lines[i]
      }
    }
  }

  let currentSection: Partial<ParsedResumeSection> | null = null
  let descriptionLines: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Skip section header
    if (line.match(experienceRegex)) continue

    // Check if this line starts a new job entry (starts with ">")
    const isNewEntry = line.startsWith(">")

    // Check if this line contains a date range (indicates new entry)
    // Supports: "2020 - 2023", "November 2024 – Present", "Jan 2020 - Dec 2023"
    // Note: Order matters - check for "present/current" first, then date patterns
    const dateMatch = line.match(
      /(\w+\s+\d{4}|\d{4})\s*[-–—]\s*(present|current|\w+\s+\d{4}|\d{4})/i
    )
    const singleDateMatch = line.match(/(?:^|\s)(\d{4})(?:\s*-\s*)?$/i)

    if (isNewEntry || dateMatch || singleDateMatch) {
      // Save previous section if exists
      if (currentSection?.position && currentSection?.company) {
        sections.push({
          position: currentSection.position,
          company: currentSection.company,
          start: currentSection.start || "",
          end: currentSection.end,
          description: descriptionLines.join("\n").trim(),
          displayOrder: sections.length,
        })
      }

      // Start new section
      currentSection = {}
      descriptionLines = []

      // If line starts with ">", it contains company/position and dates
      if (isNewEntry) {
        // Check if the line contains bullet points (●, •, ·) - if so, split them out
        let headerLine = line
        let remainingBullets = ""

        // Look for bullet markers in the line
        const bulletMatch = line.match(/[●•·]\s*(.+)$/)
        if (bulletMatch) {
          // Split the line: everything before the first bullet is the header
          const bulletIndex = line.search(/[●•·]/)
          headerLine = line.substring(0, bulletIndex).trim()
          remainingBullets = line.substring(bulletIndex).trim()
        }

        // Extract dates first (before parsePositionCompany modifies the line)
        if (dateMatch) {
          const start = dateMatch[1]
          const end = dateMatch[2]
          currentSection.start = normalizeDate(start)
          currentSection.end =
            end.toLowerCase() === "present" || end.toLowerCase() === "current"
              ? undefined
              : normalizeDate(end)
        }

        // Then parse position and company from the header part
        parsePositionCompany(headerLine, currentSection)

        // If there were bullet points on the same line, add them to description
        if (remainingBullets) {
          const bullets = remainingBullets.split(/[●•·]\s*/).filter(Boolean)
          for (const bullet of bullets) {
            const cleanBullet = bullet.trim()
            if (cleanBullet) {
              descriptionLines.push(cleanBullet)
            }
          }
        }
      } else {
        // Parse dates
        if (dateMatch) {
          const start = dateMatch[1]
          const end = dateMatch[2]
          currentSection.start = normalizeDate(start)
          currentSection.end =
            end.toLowerCase() === "present" || end.toLowerCase() === "current"
              ? undefined
              : normalizeDate(end)
        } else if (singleDateMatch) {
          currentSection.start = normalizeDate(singleDateMatch[1])
        }

        // Check if position/company is on the same line
        const beforeDate = line
          .substring(0, line.indexOf(dateMatch ? dateMatch[0] : singleDateMatch![0]))
          .trim()
        if (beforeDate && currentSection) {
          parsePositionCompany(beforeDate, currentSection)
        }
      }
    } else if (currentSection && !currentSection.position && !currentSection.company) {
      // This might be position/company line (if not already parsed)
      parsePositionCompany(line, currentSection)
    } else if (currentSection) {
      // This is part of the description
      // Handle both newline-separated and inline bullet points (●, •, ·, -, *)
      const bulletPattern = /[●•·\-\*]\s*/g
      if (line.includes("●") || line.includes("•") || line.includes("·")) {
        // Split by bullet markers and add each as a separate description line
        const bullets = line.split(bulletPattern).filter(Boolean)
        for (const bullet of bullets) {
          const cleanBullet = bullet.trim()
          if (cleanBullet) {
            descriptionLines.push(cleanBullet)
          }
        }
      } else {
        // Regular line - remove leading bullet marker if present
        const cleanLine = line.replace(/^[•·\-\*●]\s*/, "")
        if (cleanLine) {
          descriptionLines.push(cleanLine)
        }
      }
    }
  }

  // Don't forget the last section
  if (currentSection?.position && currentSection?.company) {
    sections.push({
      position: currentSection.position,
      company: currentSection.company,
      start: currentSection.start || "",
      end: currentSection.end,
      description: descriptionLines.join("\n").trim(),
      displayOrder: sections.length,
    })
  }

  return sections
}

// Main parsing function
export async function parseResumeFile(buffer: Buffer, fileType: string): Promise<ParsedResume> {
  // 1. Extract raw text based on file type
  let rawContent: string

  if (fileType === "application/pdf") {
    rawContent = await parsePDF(buffer)
  } else if (
    fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    rawContent = await parseDOCX(buffer)
  } else if (fileType === "text/plain") {
    rawContent = parseTXT(buffer)
  } else {
    throw new Error(`Unsupported file type: ${fileType}`)
  }

  // 2. Extract header
  const header = extractHeader(rawContent)

  // 3. Extract summary
  const summary = extractSummary(rawContent)

  // 4. Extract sections
  const sections = extractSections(rawContent)

  return {
    header,
    summary,
    sections,
    rawContent,
  }
}
