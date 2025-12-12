import { auth } from "@/auth"
import { archiveAchievement, unarchiveAchievement, updateAchievementReview } from "@/lib/services/achievements"
import { NextResponse } from "next/server"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { relevance, resumeSectionId, techTags, customDescription, unarchive } = body

    // Handle unarchive action
    if (unarchive === true) {
      const achievement = await unarchiveAchievement(id, session.user.id)
      return NextResponse.json({ success: true, achievement })
    }

    // Handle regular update
    const achievement = await updateAchievementReview({
      achievementId: id,
      userId: session.user.id,
      relevance,
      resumeSectionId,
      techTags,
      customDescription,
    })

    return NextResponse.json({ success: true, achievement })
  } catch (error) {
    console.error("Update achievement error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to update achievement"
    const statusCode = errorMessage.includes("not found") ? 404 : 500
    return NextResponse.json({ error: errorMessage }, { status: statusCode })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const achievement = await archiveAchievement(id, session.user.id)

    return NextResponse.json({ success: true, achievement })
  } catch (error) {
    console.error("Archive achievement error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to archive achievement"
    const statusCode = errorMessage.includes("not found") ? 404 : 500
    return NextResponse.json({ error: errorMessage }, { status: statusCode })
  }
}
