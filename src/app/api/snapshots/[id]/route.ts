import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { getSnapshot, updateSnapshot, deactivateSnapshot } from "@/lib/services/snapshots"

/**
 * GET /api/snapshots/[id] - Get a specific snapshot
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolvedParams = await Promise.resolve(params)
    const snapshot = await getSnapshot(resolvedParams.id, session.user.id)
    if (!snapshot) {
      return NextResponse.json({ error: "Snapshot not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: snapshot,
    })
  } catch (error) {
    console.error("Get snapshot error:", error)
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

/**
 * PATCH /api/snapshots/[id] - Update a snapshot
 * POST /api/snapshots/[id]/analyze - Generate GitHub analysis for snapshot
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolvedParams = await Promise.resolve(params)
    const body = await request.json()
    const { githubAnalysis, isActive, title } = body

    const snapshot = await updateSnapshot(resolvedParams.id, session.user.id, {
      githubAnalysis,
      isActive,
      title,
    })

    return NextResponse.json({
      success: true,
      data: snapshot,
    })
  } catch (error) {
    console.error("Update snapshot error:", error)
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}


/**
 * DELETE /api/snapshots/[id] - Deactivate a snapshot
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolvedParams = await Promise.resolve(params)
    const snapshotId = resolvedParams.id

    if (!snapshotId) {
      return NextResponse.json({ error: "Snapshot ID is required" }, { status: 400 })
    }

    await deactivateSnapshot(snapshotId, session.user.id)

    return NextResponse.json({
      success: true,
      message: "Snapshot deactivated",
    })
  } catch (error) {
    console.error("Delete snapshot error:", error)
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

