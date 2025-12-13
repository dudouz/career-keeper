import { auth } from "@/auth"
import { createProject, getUserProjects, createProjectsFromRepositories } from "@/lib/services/projects/projects.service"
import { NextRequest, NextResponse } from "next/server"
import type { Repository } from "@/lib/db/types"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const projects = await getUserProjects(session.user.id)
    return NextResponse.json({ success: true, data: projects })
  } catch (error) {
    console.error("[Projects API] GET error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch projects" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { repository, repositories, projectName, notes } = body

    if (repositories && Array.isArray(repositories)) {
      // Bulk create from multiple repositories
      const projectNames = body.projectNames || {}
      const projects = await createProjectsFromRepositories(
        session.user.id,
        repositories as Repository[],
        projectNames
      )
      return NextResponse.json({ success: true, data: projects })
    } else if (repository) {
      // Single repository
      const project = await createProject({
        userId: session.user.id,
        repository: repository as Repository,
        projectName,
        notes,
      })
      return NextResponse.json({ success: true, data: project })
    } else {
      return NextResponse.json({ error: "repository or repositories required" }, { status: 400 })
    }
  } catch (error) {
    console.error("[Projects API] POST error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create project" },
      { status: 500 }
    )
  }
}

