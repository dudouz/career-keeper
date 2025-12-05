import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { uploadResume, getUserResumes } from "@/lib/services/resume"

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

    // Upload resume using service
    const resume = await uploadResume({
      userId: session.user.id,
      file,
      userEmail: session.user.email!,
      userName: session.user.name,
      userImage: session.user.image,
    })

    return NextResponse.json({
      success: true,
      resume,
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

    // Get user's resumes using service
    const resumes = await getUserResumes(session.user.id, {
      userEmail: session.user.email!,
      userName: session.user.name,
      userImage: session.user.image,
    })

    return NextResponse.json({
      resumes,
    })
  } catch (error) {
    console.error("Get resumes error:", error)
    return NextResponse.json({ error: "Failed to get resumes" }, { status: 500 })
  }
}

