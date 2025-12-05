import { auth } from "@/auth"
import { bulkUpdateBrags } from "@/lib/services/brags"
import { NextResponse } from "next/server"

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { bragIds, relevance, resumeSectionId, techTags, reviewStatus } = body

    const result = await bulkUpdateBrags({
      userId: session.user.id,
      bragIds,
      relevance,
      resumeSectionId,
      techTags,
      reviewStatus,
    })

    return NextResponse.json({ success: true, updated: result.updated })
  } catch (error) {
    console.error("Bulk update brags error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to update brags"
    const statusCode =
      errorMessage.includes("not found") || errorMessage.includes("access denied")
        ? 403
        : errorMessage.includes("must be a non-empty array")
          ? 400
          : 500
    return NextResponse.json({ error: errorMessage }, { status: statusCode })
  }
}
