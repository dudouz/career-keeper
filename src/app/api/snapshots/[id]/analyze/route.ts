import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { generateSnapshotAnalysis } from "@/lib/services/snapshots"

/**
 * POST /api/snapshots/[id]/analyze - Generate GitHub analysis for snapshot
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolvedParams = await Promise.resolve(params)
    const snapshot = await generateSnapshotAnalysis(resolvedParams.id, session.user.id)

    return NextResponse.json({
      success: true,
      data: snapshot,
    })
  } catch (error) {
    console.error("Generate snapshot analysis error:", error)
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

