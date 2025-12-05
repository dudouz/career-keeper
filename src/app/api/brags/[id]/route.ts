import { auth } from "@/auth"
import { archiveBrag, unarchiveBrag, updateBragReview } from "@/lib/services/brags"
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
      const brag = await unarchiveBrag(id, session.user.id)
      return NextResponse.json({ success: true, brag })
    }

    // Handle regular update
    const brag = await updateBragReview({
      bragId: id,
      userId: session.user.id,
      relevance,
      resumeSectionId,
      techTags,
      customDescription,
    })

    return NextResponse.json({ success: true, brag })
  } catch (error) {
    console.error("Update brag error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to update brag"
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
    const brag = await archiveBrag(id, session.user.id)

    return NextResponse.json({ success: true, brag })
  } catch (error) {
    console.error("Archive brag error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to archive brag"
    const statusCode = errorMessage.includes("not found") ? 404 : 500
    return NextResponse.json({ error: errorMessage }, { status: statusCode })
  }
}
