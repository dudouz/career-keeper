import { auth } from "@/auth"
import { getAchievementStats } from "@/lib/services/achievements"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const stats = await getAchievementStats(session.user.id)

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Get achievement stats error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to get achievement stats"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
