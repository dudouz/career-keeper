import { auth } from "@/auth"
import { getProjectById, updateProject, deactivateProject } from "@/lib/services/projects/projects.service"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: projectId } = await Promise.resolve(params)
    if (!projectId) {
      return NextResponse.json({ error: "Project ID required" }, { status: 400 })
    }

    const project = await getProjectById(projectId, session.user.id)
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: project })
  } catch (error) {
    console.error("[Projects API] GET error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch project" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: projectId } = await Promise.resolve(params)
    if (!projectId) {
      return NextResponse.json({ error: "Project ID required" }, { status: 400 })
    }

    const body = await req.json()
    const { projectName, notes } = body

    const updatedProject = await updateProject({
      projectId,
      userId: session.user.id,
      projectName,
      notes,
    })

    return NextResponse.json({ success: true, data: updatedProject })
  } catch (error) {
    console.error("[Projects API] PATCH error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update project" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: projectId } = await Promise.resolve(params)
    if (!projectId) {
      return NextResponse.json({ error: "Project ID required" }, { status: 400 })
    }

    await deactivateProject(projectId, session.user.id)

    return NextResponse.json({ success: true, message: "Project deleted successfully" })
  } catch (error) {
    console.error("[Projects API] DELETE error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete project" },
      { status: 500 }
    )
  }
}

