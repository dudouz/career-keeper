import { auth } from "@/auth"
import type { BragReviewStatus, BragType } from "@/lib/db/types"
import {
  createBrag,
  getBrags,
  type CreateBragParams,
  type GetBragsParams,
} from "@/lib/services/brags"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const reviewStatus = searchParams.get("reviewStatus") as BragReviewStatus | null
    const type = searchParams.get("type") as BragType | null
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 50
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!, 10) : 0

    const params: GetBragsParams = {
      userId: session.user.id,
      limit,
      offset,
    }

    if (reviewStatus) {
      params.reviewStatus = reviewStatus
    }

    if (type) {
      params.type = type
    }

    const result = await getBrags(params)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Get brags error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to get brags"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      type,
      title,
      description,
      date,
      repository,
      url,
      githubId,
      githubType,
    }: CreateBragParams = body

    // Validate required fields
    if (!type || !title || !date || !repository || !url || !githubType) {
      return NextResponse.json(
        { error: "Missing required fields: type, title, date, repository, url, githubType" },
        { status: 400 }
      )
    }

    const params: CreateBragParams = {
      userId: session.user.id,
      type,
      title,
      description,
      date: new Date(date),
      repository,
      url,
      githubId,
      githubType,
    }

    const brag = await createBrag(params)

    return NextResponse.json({ success: true, brag }, { status: 201 })
  } catch (error) {
    console.error("Create brag error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to create brag"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
