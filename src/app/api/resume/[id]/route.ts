import { auth } from "@/auth"
import { deleteResume } from "@/lib/services/resume"
import { NextRequest, NextResponse } from "next/server"

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: resumeId } = await params

    // Delete resume using service
    await deleteResume({
      userId: session.user.id,
      resumeId,
    })

    return NextResponse.json({
      success: true,
      message: "Resume deleted successfully",
    })
  } catch (error) {
    console.error("Resume delete error:", error)

    // Handle specific error messages from service
    const errorMessage = error instanceof Error ? error.message : "Failed to delete resume"
    const statusCode = errorMessage.includes("not found") ? 404 : 500

    return NextResponse.json({ error: errorMessage }, { status: statusCode })
  }
}
