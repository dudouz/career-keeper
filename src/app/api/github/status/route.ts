import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { getGitHubStatus } from "@/lib/services/github"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ connected: false }, { status: 200 })
    }

    // Get GitHub status using service
    const status = await getGitHubStatus(session.user.id)

    return NextResponse.json(status)
  } catch (error) {
    console.error("GitHub status check error:", error)
    return NextResponse.json({ connected: false }, { status: 200 })
  }
}

