import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { z } from "zod"
import { connectGitHub } from "@/lib/services/github"

const connectSchema = z.object({
  token: z.string().min(1, "GitHub token is required"),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validation = connectSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.format() },
        { status: 400 }
      )
    }

    const { token } = validation.data

    // Connect GitHub using service
    const result = await connectGitHub({
      userId: session.user.id,
      userEmail: session.user.email!,
      userName: session.user.name,
      token,
    })

    return NextResponse.json({
      success: true,
      username: result.username,
      rateLimit: result.rateLimit,
    })
  } catch (error) {
    console.error("GitHub connect error:", error)

    // Handle specific error messages from service
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    const statusCode = errorMessage.includes("Invalid GitHub token") ? 401 : 500

    return NextResponse.json({ error: errorMessage }, { status: statusCode })
  }
}

