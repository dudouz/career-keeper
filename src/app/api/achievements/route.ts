import { auth } from "@/auth"
import {
  createAchievement,
  getAchievements,
  parseGetAchievementsParams,
  type CreateAchievementParams,
} from "@/lib/services/achievements"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const params = parseGetAchievementsParams(session.user.id, searchParams)
    const result = await getAchievements(params)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Get achievements error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to get achievements"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      type,
      title,
      description,
      date,
      repository,
      url,
      githubId,
      githubType,
    }: CreateAchievementParams = body

    // Validate required fields
    if (!type || !title || !date || !repository || !url || !githubType) {
      return NextResponse.json(
        { error: "Missing required fields: type, title, date, repository, url, githubType" },
        { status: 400 }
      )
    }

    const params: CreateAchievementParams = {
      userId: session.user.id,
      type,
      title,
      description,
      date: new Date(date),
      repository,
      url,
      githubId,
      githubType,
    }

    const achievement = await createAchievement(params)

    return NextResponse.json({ success: true, achievement }, { status: 201 })
  } catch (error) {
    console.error("Create achievement error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to create achievement"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
