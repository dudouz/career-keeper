import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ connected: false }, { status: 200 })
    }

    // Check if user has GitHub PAT
    const [user] = await db
      .select({ githubPat: users.githubPat, githubUsername: users.githubUsername })
      .from(users)
      .where(eq(users.id, session.user.id))

    return NextResponse.json({
      connected: !!user?.githubPat,
      username: user?.githubUsername || null,
    })
  } catch (error) {
    console.error("GitHub status check error:", error)
    return NextResponse.json({ connected: false }, { status: 200 })
  }
}

