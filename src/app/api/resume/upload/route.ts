import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { resumes, resumeSections, users } from "@/lib/db/schema"
import { parseResumeFile } from "@/lib/resume/parser"
import { eq } from "drizzle-orm"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Ensure user exists in database (handles cases where DB was reset/migrated)
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))

    if (!existingUser) {
      // Create user record if it doesn't exist
      console.log("[Resume Upload] Creating user record for:", session.user.id)
      await db.insert(users).values({
        id: session.user.id,
        email: session.user.email!,
        name: session.user.name || null,
        image: session.user.image || null,
        emailVerified: new Date(),
        subscriptionTier: "basic",
        subscriptionStatus: "active",
      })
      console.log("[Resume Upload] User created successfully")
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload PDF (recommended), DOCX, or TXT files." },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Parse resume with new structured extraction
    const parsed = await parseResumeFile(buffer, file.type)

    // Determine file type label
    let fileType = "txt"
    if (file.type === "application/pdf") fileType = "pdf"
    else if (
      file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )
      fileType = "docx"

    // Store file as base64 (for MVP - no external storage needed)
    const fileUrl = `data:${file.type};base64,${buffer.toString("base64")}`

    // Check if user already has a resume
    const existingResumes = await db
      .select()
      .from(resumes)
      .where(eq(resumes.userId, session.user.id))

    // Deactivate existing resumes
    if (existingResumes.length > 0) {
      await db
        .update(resumes)
        .set({ isActive: false })
        .where(eq(resumes.userId, session.user.id))
    }

    // Insert new resume with structured fields
    const [newResume] = await db
      .insert(resumes)
      .values({
        userId: session.user.id,
        title: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension

        // Header fields (convert empty strings to null)
        name: parsed.header.name || null,
        email: parsed.header.email || null,
        phone: parsed.header.phone || null,
        git: parsed.header.git || null,
        linkedin: parsed.header.linkedin || null,
        website: parsed.header.website || null,

        // Summary
        summary: parsed.summary || null,

        // File metadata
        rawContent: parsed.rawContent,
        fileName: file.name,
        fileType,
        fileUrl,
        isActive: true,
      })
      .returning()

    // Insert resume sections (work experience)
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

    return NextResponse.json({
      success: true,
      resume: completeResume,
      message: "Resume uploaded and parsed successfully",
    })
  } catch (error) {
    console.error("Resume upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload resume. Please try again." },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Ensure user exists in database (handles cases where DB was reset/migrated)
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))

    if (!existingUser) {
      // Create user record if it doesn't exist
      console.log("[Resume GET] Creating user record for:", session.user.id)
      await db.insert(users).values({
        id: session.user.id,
        email: session.user.email!,
        name: session.user.name || null,
        image: session.user.image || null,
        emailVerified: new Date(),
        subscriptionTier: "basic",
        subscriptionStatus: "active",
      })
      console.log("[Resume GET] User created successfully")
    }

    // Get user's resumes with sections
    const userResumes = await db.query.resumes.findMany({
      where: (resumes, { eq }) => eq(resumes.userId, session.user.id),
      with: {
        sections: {
          orderBy: (sections, { asc }) => [asc(sections.displayOrder)],
        },
      },
      orderBy: (resumes, { desc }) => [desc(resumes.createdAt)],
    })

    return NextResponse.json({
      resumes: userResumes,
    })
  } catch (error) {
    console.error("Get resumes error:", error)
    return NextResponse.json({ error: "Failed to get resumes" }, { status: 500 })
  }
}

