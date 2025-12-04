import { auth } from "@/auth"
import { db } from "@/lib/db"
import { resumes } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
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

    // Delete resume (sections will be deleted via cascade)
    const result = await db
      .delete(resumes)
      .where(and(eq(resumes.id, resumeId), eq(resumes.userId, session.user.id)))
      .returning()

    if (result.length === 0) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Resume deleted successfully",
    })
  } catch (error) {
    console.error("Resume delete error:", error)
    return NextResponse.json({ error: "Failed to delete resume" }, { status: 500 })
  }
}
