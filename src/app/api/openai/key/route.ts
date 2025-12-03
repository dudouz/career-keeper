import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { z } from "zod"
import { encryptToken, decryptToken } from "@/lib/github/encryption"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

const keySchema = z.object({
  apiKey: z.string().min(1, "OpenAI API key is required"),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validation = keySchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.format() },
        { status: 400 }
      )
    }

    const { apiKey } = validation.data

    // Encrypt the API key
    const encryptedKey = encryptToken(apiKey)

    // Check if user exists
    const [existingUser] = await db.select().from(users).where(eq(users.id, session.user.id))

    if (existingUser) {
      // Update existing user
      await db
        .update(users)
        .set({ openaiApiKey: encryptedKey })
        .where(eq(users.id, session.user.id))
    } else {
      // Create new user record for OAuth user
      await db.insert(users).values({
        id: session.user.id,
        email: session.user.email!,
        name: session.user.name,
        image: session.user.image,
        emailVerified: new Date(),
        openaiApiKey: encryptedKey,
        subscriptionTier: "basic",
        subscriptionStatus: "active",
      })
    }

    return NextResponse.json({
      success: true,
      message: "OpenAI API key saved successfully",
    })
  } catch (error) {
    console.error("OpenAI key save error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [user] = await db
      .select({ openaiApiKey: users.openaiApiKey })
      .from(users)
      .where(eq(users.id, session.user.id))

    if (!user?.openaiApiKey) {
      return NextResponse.json({ hasKey: false })
    }

    // Return decrypted key
    const decryptedKey = decryptToken(user.openaiApiKey)

    return NextResponse.json({
      hasKey: true,
      apiKey: decryptedKey,
    })
  } catch (error) {
    console.error("OpenAI key fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await db
      .update(users)
      .set({ openaiApiKey: null })
      .where(eq(users.id, session.user.id))

    return NextResponse.json({
      success: true,
      message: "OpenAI API key deleted successfully",
    })
  } catch (error) {
    console.error("OpenAI key delete error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

