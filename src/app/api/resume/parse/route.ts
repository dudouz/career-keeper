import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { parseResumeWithAI, updateResumeWithLLM } from "@/lib/services/resume"

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

    // Check if request contains resumeId or file
    const contentType = request.headers.get("content-type") || ""

    if (contentType.includes("application/json")) {
      // Parse existing resume by ID and update database
      const { resumeId } = await request.json()

      if (!resumeId) {
        return NextResponse.json({ error: "Resume ID is required" }, { status: 400 })
      }

      // Parse and update resume using service
      const updatedResume = await updateResumeWithLLM({
        userId: session.user.id,
        resumeId,
      })

      return NextResponse.json({
        success: true,
        resume: updatedResume,
        message: "Resume parsed and updated successfully",
      })
    } else if (contentType.includes("multipart/form-data")) {
      // Parse uploaded file (without saving to database)
      const formData = await request.formData()
      const file = formData.get("file") as File

      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 })
      }

      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: "Invalid file type. Please upload PDF, DOCX, or TXT files." },
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

      // Parse file using service
      const parsed = await parseResumeWithAI({
        userId: session.user.id,
        file,
      })

      return NextResponse.json({
        success: true,
        data: parsed,
        message: "File parsed successfully",
      })
    } else {
      return NextResponse.json(
        { error: "Invalid request. Send JSON with resumeId or multipart/form-data with file." },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error("Resume parse error:", error)

    // Handle specific error messages from service
    const errorMessage = error instanceof Error ? error.message : "Failed to parse resume"
    let statusCode = 500

    if (errorMessage.includes("not found")) {
      statusCode = 404
    } else if (errorMessage.includes("not configured") || errorMessage.includes("API key")) {
      statusCode = 400
    }

    return NextResponse.json(
      {
        error: errorMessage,
      },
      { status: statusCode }
    )
  }
}
