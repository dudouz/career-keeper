import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { z } from "zod"
import { saveOpenAIKey, getOpenAIKey, deleteOpenAIKey } from "@/lib/services/user"

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

    // Save OpenAI key using service
    await saveOpenAIKey({
      userId: session.user.id,
      userEmail: session.user.email!,
      userName: session.user.name,
      userImage: session.user.image,
      apiKey,
    })

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

    // Get OpenAI key using service
    const result = await getOpenAIKey(session.user.id)

    return NextResponse.json(result)
  } catch (error) {
    console.error("OpenAI key fetch error:", error)

    // Handle specific error messages from service
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Delete OpenAI key using service
    await deleteOpenAIKey(session.user.id)

    return NextResponse.json({
      success: true,
      message: "OpenAI API key deleted successfully",
    })
  } catch (error) {
    console.error("OpenAI key delete error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

