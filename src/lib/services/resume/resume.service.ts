import { db } from "@/lib/db"
import { resumes, resumeSections, users } from "@/lib/db/schema"
import { parseResumeFile } from "@/lib/resume/parser"
import { decryptToken } from "@/lib/github/encryption"
import { eq, and } from "drizzle-orm"
import type {
  UploadResumeParams,
  ParseResumeParams,
  DeleteResumeParams,
  ResumeWithSections,
  ParsedResume,
} from "./resume.types"

// Helper: Ensure user exists in database
async function ensureUserExists(
  userId: string,
  userEmail: string,
  userName?: string | null,
  userImage?: string | null
): Promise<void> {
  const [existingUser] = await db.select().from(users).where(eq(users.id, userId))

  if (!existingUser) {
    console.log("[Resume Service] Creating user record for:", userId)
    await db.insert(users).values({
      id: userId,
      email: userEmail,
      name: userName || null,
      image: userImage || null,
      emailVerified: new Date(),
      subscriptionTier: "basic",
      subscriptionStatus: "active",
    })
    console.log("[Resume Service] User created successfully")
  }
}

// Helper: Get user's decrypted OpenAI API key
async function getUserOpenAIKey(userId: string): Promise<string | null> {
  const [user] = await db.select().from(users).where(eq(users.id, userId))

  if (!user?.openaiApiKey) {
    return null
  }

  try {
    return decryptToken(user.openaiApiKey)
  } catch (error) {
    console.error("Failed to decrypt OpenAI API key:", error)
    return null
  }
}

// Helper: Parse file to buffer and determine file type
async function parseFileBuffer(file: File): Promise<{ buffer: Buffer; fileType: string }> {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  let fileType = "txt"
  if (file.type === "application/pdf") {
    fileType = "pdf"
  } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    fileType = "docx"
  }

  return { buffer, fileType }
}

// Helper: Store parsed resume data
async function storeResumeData(
  userId: string,
  fileName: string,
  fileType: string,
  fileUrl: string,
  parsed: ParsedResume
): Promise<ResumeWithSections> {
  // Deactivate existing resumes
  const existingResumes = await db.select().from(resumes).where(eq(resumes.userId, userId))

  if (existingResumes.length > 0) {
    await db.update(resumes).set({ isActive: false }).where(eq(resumes.userId, userId))
  }

  // Insert new resume
  const [newResume] = await db
    .insert(resumes)
    .values({
      userId,
      title: fileName.replace(/\.[^/.]+$/, ""), // Remove file extension
      name: parsed.header.name || null,
      email: parsed.header.email || null,
      phone: parsed.header.phone || null,
      git: parsed.header.git || null,
      linkedin: parsed.header.linkedin || null,
      website: parsed.header.website || null,
      summary: parsed.summary || null,
      rawContent: parsed.rawContent,
      fileName,
      fileType,
      fileUrl,
      isActive: true,
    })
    .returning()

  // Insert resume sections
  if (parsed.sections.length > 0) {
    await db.insert(resumeSections).values(
      parsed.sections.map((section) => ({
        resumeId: newResume.id,
        startDate: section.start,
        endDate: section.end,
        position: section.position,
        company: section.company,
        description: section.description,
        displayOrder: section.displayOrder,
      }))
    )
  }

  // Fetch complete resume with sections
  const completeResume = await db.query.resumes.findFirst({
    where: (resumes, { eq }) => eq(resumes.id, newResume.id),
    with: {
      sections: {
        orderBy: (sections, { asc }) => [asc(sections.displayOrder)],
      },
    },
  })

  if (!completeResume) {
    throw new Error("Failed to fetch created resume")
  }

  return completeResume as ResumeWithSections
}

/**
 * Upload and parse a resume file
 * Uses LLM parsing if user has OpenAI API key configured, otherwise falls back to regex
 */
export async function uploadResume(
  params: UploadResumeParams & {
    userEmail: string
    userName?: string | null
    userImage?: string | null
  }
): Promise<ResumeWithSections> {
  const { userId, file, userEmail, userName, userImage } = params

  // Ensure user exists
  await ensureUserExists(userId, userEmail, userName, userImage)

  // Parse file
  const { buffer, fileType } = await parseFileBuffer(file)

  // Check if user has OpenAI API key for LLM parsing
  const openaiApiKey = await getUserOpenAIKey(userId)

  // Parse resume - use LLM if API key is available, otherwise fallback to regex
  const parsed = await parseResumeFile(buffer, file.type, {
    useLLM: !!openaiApiKey,
    openaiApiKey: openaiApiKey || undefined,
  })

  console.log(
    `[Resume Service] Parsed resume using ${openaiApiKey ? "LLM" : "regex"} parser - found ${parsed.sections.length} sections`
  )

  // Store file as base64
  const fileUrl = `data:${file.type};base64,${buffer.toString("base64")}`

  // Store in database
  return storeResumeData(userId, file.name, fileType, fileUrl, parsed)
}

/**
 * Re-parse and update an existing resume with LLM
 * Parses the resume and updates the database with new extracted data
 */
export async function updateResumeWithLLM(params: {
  userId: string
  resumeId: string
}): Promise<ResumeWithSections> {
  const { userId, resumeId } = params

  // Parse the resume with LLM
  const parsed = await parseResumeWithAI({ userId, resumeId })

  // Delete old sections
  await db.delete(resumeSections).where(eq(resumeSections.resumeId, resumeId))

  // Update resume with new structured data
  await db
    .update(resumes)
    .set({
      name: parsed.header.name || null,
      email: parsed.header.email || null,
      phone: parsed.header.phone || null,
      git: parsed.header.git || null,
      linkedin: parsed.header.linkedin || null,
      website: parsed.header.website || null,
      summary: parsed.summary || null,
      updatedAt: new Date(),
    })
    .where(and(eq(resumes.id, resumeId), eq(resumes.userId, userId)))

  // Insert new sections
  if (parsed.sections.length > 0) {
    await db.insert(resumeSections).values(
      parsed.sections.map((section) => ({
        resumeId,
        startDate: section.start,
        endDate: section.end,
        position: section.position,
        company: section.company,
        description: section.description,
        displayOrder: section.displayOrder,
      }))
    )
  }

  // Fetch updated resume with sections
  const updatedResume = await db.query.resumes.findFirst({
    where: (resumes, { eq }) => eq(resumes.id, resumeId),
    with: {
      sections: {
        orderBy: (sections, { asc }) => [asc(sections.displayOrder)],
      },
    },
  })

  if (!updatedResume) {
    throw new Error("Failed to fetch updated resume")
  }

  return updatedResume as ResumeWithSections
}

/**
 * Parse resume using LLM (requires OpenAI API key)
 * Can accept either a resumeId or a file
 * Returns parsed data without saving to database
 */
export async function parseResumeWithAI(params: ParseResumeParams): Promise<ParsedResume> {
  const { userId, resumeId, file } = params

  // Get user's OpenAI API key
  const openaiApiKey = await getUserOpenAIKey(userId)

  if (!openaiApiKey) {
    throw new Error("OpenAI API key not configured. Please add your API key in settings.")
  }

  let buffer: Buffer
  let fileType: string

  if (resumeId) {
    // Parse existing resume by ID
    const resume = await db.query.resumes.findFirst({
      where: (resumes, { eq, and }) => and(eq(resumes.id, resumeId), eq(resumes.userId, userId)),
    })

    if (!resume) {
      throw new Error("Resume not found")
    }

    if (!resume.fileUrl) {
      throw new Error("Resume has no file to parse")
    }

    // Extract base64 data from data URL
    const base64Data = resume.fileUrl.split(",")[1]
    if (!base64Data) {
      throw new Error("Invalid file URL format")
    }

    buffer = Buffer.from(base64Data, "base64")
    fileType =
      resume.fileType === "pdf"
        ? "application/pdf"
        : resume.fileType === "docx"
          ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          : "text/plain"
  } else if (file) {
    // Parse uploaded file
    const parsed = await parseFileBuffer(file)
    buffer = parsed.buffer
    fileType = file.type
  } else {
    throw new Error("Either resumeId or file must be provided")
  }

  // Parse with LLM
  const parsed = await parseResumeFile(buffer, fileType, {
    openaiApiKey,
    useLLM: true,
  })

  return parsed
}

/**
 * Delete a resume and its sections
 */
export async function deleteResume(params: DeleteResumeParams): Promise<void> {
  const { userId, resumeId } = params

  // Delete resume (sections will be deleted via cascade)
  const result = await db
    .delete(resumes)
    .where(and(eq(resumes.id, resumeId), eq(resumes.userId, userId)))
    .returning()

  if (result.length === 0) {
    throw new Error("Resume not found")
  }
}

/**
 * Get all resumes for a user
 */
export async function getUserResumes(
  userId: string,
  options?: { userEmail: string; userName?: string | null; userImage?: string | null }
): Promise<ResumeWithSections[]> {
  // Ensure user exists if options provided
  if (options) {
    await ensureUserExists(userId, options.userEmail, options.userName, options.userImage)
  }

  // Get user's resumes with sections
  const userResumes = await db.query.resumes.findMany({
    where: (resumes, { eq }) => eq(resumes.userId, userId),
    with: {
      sections: {
        orderBy: (sections, { asc }) => [asc(sections.displayOrder)],
      },
    },
    orderBy: (resumes, { desc }) => [desc(resumes.createdAt)],
  })

  return userResumes as ResumeWithSections[]
}
