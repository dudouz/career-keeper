import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { LLMClient } from "@/lib/llm/client"
import { rateLimit } from "@/lib/rate-limit"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { decryptToken } from "@/lib/github/encryption"

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

    // Fetch OpenAI API key from database
    const [user] = await db
      .select({ openaiApiKey: users.openaiApiKey })
      .from(users)
      .where(eq(users.id, session.user.id))

    if (!user?.openaiApiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not found. Please add it in settings." },
        { status: 400 }
      )
    }

    const apiKey = decryptToken(user.openaiApiKey)

    // Parse request body
    const body = await req.json()
    const { contributions } = body

    if (!contributions) {
      return NextResponse.json(
        { error: "GitHub contributions data is required" },
        { status: 400 }
      )
    }

    // Create LLM client and analyze
    const llmClient = new LLMClient({ apiKey })
    const analysis = await llmClient.analyzeContributions(contributions)

    // Estimate tokens used
    const estimatedTokens = llmClient.estimateTokens(
      JSON.stringify(contributions) + JSON.stringify(analysis)
    )

    return NextResponse.json({
      success: true,
      data: analysis,
      meta: {
        estimatedTokens,
        remaining: rateLimitResult.remaining,
      },
    })
  } catch (error) {
    console.error("LLM analyze error:", error)

    // Handle OpenAI specific errors
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        return NextResponse.json(
          { error: "Invalid OpenAI API key" },
          { status: 401 }
        )
      }
      if (error.message.includes("quota")) {
        return NextResponse.json(
          { error: "OpenAI API quota exceeded" },
          { status: 429 }
        )
      }
    }

    return NextResponse.json(
      { error: "Failed to analyze contributions" },
      { status: 500 }
    )
  }
}

