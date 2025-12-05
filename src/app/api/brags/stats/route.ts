import { auth } from "@/auth"
import { getBragStats } from "@/lib/services/brags"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const stats = await getBragStats(session.user.id)

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Get brag stats error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to get brag stats"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
