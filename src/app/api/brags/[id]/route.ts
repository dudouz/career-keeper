import { auth } from "@/auth"
import { archiveBrag, updateBragReview } from "@/lib/services/brags"
import { NextResponse } from "next/server"

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { relevance, resumeSectionId, techTags, customDescription } = body

    const brag = await updateBragReview({
      bragId: params.id,
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

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const brag = await archiveBrag(params.id, session.user.id)

    return NextResponse.json({ success: true, brag })
  } catch (error) {
    console.error("Archive brag error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to archive brag"
    const statusCode = errorMessage.includes("not found") ? 404 : 500
    return NextResponse.json({ error: errorMessage }, { status: statusCode })
  }
}
