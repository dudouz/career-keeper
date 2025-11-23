import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { z } from "zod"
import { GitHubClient } from "@/lib/github/client"
import { encryptToken } from "@/lib/github/encryption"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

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

    // Validate token with GitHub
    const githubClient = new GitHubClient(token)
    const validationResult = await githubClient.validateToken()

    if (!validationResult.valid) {
      return NextResponse.json(
        { error: validationResult.error || "Invalid GitHub token" },
        { status: 401 }
      )
    }

    // Encrypt token
    const encryptedToken = encryptToken(token)

    // Check if user exists in database (OAuth users might not)
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))

    if (!existingUser) {
      // Create user record for OAuth users
      console.log("[GitHub Connect] Creating new user record for OAuth user:", session.user.id)
      await db.insert(users).values({
        id: session.user.id,
        email: session.user.email!,
        name: session.user.name,
        githubPat: encryptedToken,
        githubUsername: validationResult.username,
      })
    } else {
      // Update existing user with GitHub PAT
      console.log("[GitHub Connect] Updating user:", session.user.id, "with username:", validationResult.username)
      await db
        .update(users)
        .set({ 
          githubPat: encryptedToken,
          githubUsername: validationResult.username 
        })
        .where(eq(users.id, session.user.id))
    }

    // Check rate limit
    const rateLimit = await githubClient.checkRateLimit()

    return NextResponse.json({
      success: true,
      username: validationResult.username,
      rateLimit: {
        remaining: rateLimit.remaining,
        limit: rateLimit.limit,
      },
    })
  } catch (error) {
    console.error("GitHub connect error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

