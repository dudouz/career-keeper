import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { resumes } from "@/lib/db/schema"
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

    // Parse resume
    const { text, content } = await parseResumeFile(buffer, file.type)

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

    // Insert new resume
    const [newResume] = await db
      .insert(resumes)
      .values({
        userId: session.user.id,
        title: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
        content,
        rawContent: text,
        fileName: file.name,
        fileType,
        fileUrl,
        isActive: true,
      })
      .returning()

    return NextResponse.json({
      success: true,
      resume: {
        id: newResume.id,
        title: newResume.title,
        fileName: newResume.fileName,
        fileType: newResume.fileType,
        content: newResume.content,
      },
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

    // Get user's resumes
    const userResumes = await db
      .select({
        id: resumes.id,
        title: resumes.title,
        fileName: resumes.fileName,
        fileType: resumes.fileType,
        isActive: resumes.isActive,
        createdAt: resumes.createdAt,
        updatedAt: resumes.updatedAt,
      })
      .from(resumes)
      .where(eq(resumes.userId, session.user.id))

    return NextResponse.json({
      resumes: userResumes,
    })
  } catch (error) {
    console.error("Get resumes error:", error)
    return NextResponse.json({ error: "Failed to get resumes" }, { status: 500 })
  }
}

