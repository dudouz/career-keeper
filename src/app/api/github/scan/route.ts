import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { scanGitHubContributions, getGitHubContributions } from "@/lib/services/github"

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Scan GitHub contributions using service
    const result = await scanGitHubContributions({ userId: session.user.id })

    return NextResponse.json({
      success: true,
      contributions: result.contributions,
      message: result.message,
    })
  } catch (error) {
    console.error("GitHub scan error:", error)

    // Handle specific error messages from service
    const errorMessage = error instanceof Error ? error.message : "Failed to scan GitHub contributions"
    let statusCode = 500

    if (errorMessage.includes("not found") || errorMessage.includes("connect")) {
      statusCode = 400
    } else if (errorMessage.includes("limit reached")) {
      statusCode = 429
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode })
  }
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get cached contributions using service
    const result = await getGitHubContributions({ userId: session.user.id })

    return NextResponse.json({
      contributions: result.contributions,
      lastScanned: result.lastScanned,
      scanCount: result.scanCount,
    })
  } catch (error) {
    console.error("Get contributions error:", error)

    // Handle specific error messages from service
    const errorMessage = error instanceof Error ? error.message : "Failed to get contributions"
    const statusCode = errorMessage.includes("not found") ? 404 : 500

    return NextResponse.json({ error: errorMessage }, { status: statusCode })
  }
}

