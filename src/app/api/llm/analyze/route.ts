import { auth } from "@/auth"
import { analyzeContributions } from "@/lib/services/llm"
import { rateLimit } from "@/lib/rate-limit"
import { NextRequest, NextResponse } from "next/server"

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  maxRequests: 10,
})

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Rate limiting
    const rateLimitResult = limiter.check(session.user.email)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      )
    }

    // Parse request body
    const body = await req.json()
    const { contributions } = body

    if (!contributions) {
      return NextResponse.json({ error: "GitHub contributions data is required" }, { status: 400 })
    }

    // Analyze contributions using service
    const result = await analyzeContributions({
      userId: session.user.id,
      contributions,
    })

    return NextResponse.json({
      success: true,
      data: {
        achievements: result.achievements,
        skills: result.skills,
        projects: result.projects,
      },
      meta: {
        estimatedTokens: result.estimatedTokens,
        remaining: rateLimitResult.remaining,
      },
    })
  } catch (error) {
    console.error("LLM analyze error:", error)

    // Handle specific error messages from service
    const errorMessage = error instanceof Error ? error.message : "Failed to analyze contributions"
    let statusCode = 500

    if (errorMessage.includes("API key not found") || errorMessage.includes("not configured")) {
      statusCode = 400
    } else if (errorMessage.includes("Invalid") || errorMessage.includes("decrypt")) {
      statusCode = 401
    } else if (errorMessage.includes("quota")) {
      statusCode = 429
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode })
  }
}
