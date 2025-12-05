import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { generateSummary } from "@/lib/services/llm"
import { rateLimit } from "@/lib/rate-limit"

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
    const { contributions, currentSummary, tone } = body

    if (!contributions) {
      return NextResponse.json(
        { error: "GitHub contributions data is required" },
        { status: 400 }
      )
    }

    // Generate summary using service
    const result = await generateSummary({
      userId: session.user.id,
      contributions,
      currentSummary,
      tone: tone || "hybrid",
    })

    return NextResponse.json({
      success: true,
      data: {
        summary: result.summary,
        alternatives: result.alternatives,
      },
      meta: {
        estimatedTokens: result.estimatedTokens,
        remaining: rateLimitResult.remaining,
      },
    })
  } catch (error) {
    console.error("LLM summarize error:", error)

    // Handle specific error messages from service
    const errorMessage = error instanceof Error ? error.message : "Failed to generate summary"
    let statusCode = 500

    if (errorMessage.includes("Invalid tone")) {
      statusCode = 400
    } else if (errorMessage.includes("API key not found") || errorMessage.includes("not configured")) {
      statusCode = 400
    } else if (errorMessage.includes("Invalid") || errorMessage.includes("decrypt")) {
      statusCode = 401
    } else if (errorMessage.includes("quota")) {
      statusCode = 429
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode })
  }
}

