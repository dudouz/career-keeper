import { auth } from "@/auth"
import { rateLimit } from "@/lib/rate-limit"
import { analyzeContributionsWithAgent } from "@/lib/services/agents"
import { getSnapshot, updateSnapshot } from "@/lib/services/snapshots/snapshots.service"
import { NextRequest } from "next/server"
import type { GitHubContributionData } from "@/lib/db/types"

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  maxRequests: 5, // Lower limit for AI-intensive operations
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id || !session?.user?.email) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    const resolvedParams = await Promise.resolve(params)
    const snapshotId = resolvedParams.id

    if (!snapshotId) {
      return new Response(JSON.stringify({ error: "Snapshot ID required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Get snapshot and verify ownership
    const snapshot = await getSnapshot(snapshotId, session.user.id)
    if (!snapshot) {
      return new Response(JSON.stringify({ error: "Snapshot not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Rate limiting
    const rateLimitResult = limiter.check(session.user.email)
    if (!rateLimitResult.success) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
        {
          status: 429,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    // Parse request body for analysis options
    const body = await req.json()
    const { options } = body

    // Get contributions from snapshot
    const githubContributionsData = snapshot.githubContributionsData as any
    const contributions: GitHubContributionData | undefined = 
      githubContributionsData?.data || githubContributionsData

    if (!contributions) {
      return new Response(
        JSON.stringify({ error: "No GitHub contributions data found in snapshot" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    // Create a ReadableStream for SSE
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()

        const sendProgress = (data: {
          step: "step1" | "step2" | "step3" | "consolidated"
          current: number
          total: number
          message: string
        }) => {
          try {
            const message = `data: ${JSON.stringify({ type: "progress", ...data })}\n\n`
            controller.enqueue(encoder.encode(message))
          } catch (error) {
            // Ignore errors if controller is already closed
            console.warn("[Stream] Failed to send progress (controller may be closed):", error)
          }
        }

        try {
          // Analyze contributions with progress callbacks
          const result = await analyzeContributionsWithAgent({
            userId: session.user.id,
            contributions,
            options: {
              ...options,
              onProgress: sendProgress,
            },
          })

          // Save analysis to snapshot
          await updateSnapshot(snapshotId, session.user.id, {
            githubAnalysis: {
              consolidatedReport: result.consolidatedReport,
              metadata: result.metadata,
            },
          })

          // Send final result
          try {
            const finalMessage = `data: ${JSON.stringify({
              type: "complete",
              data: {
                consolidatedReport: result.consolidatedReport,
                richAnalysis: result.richAnalysis,
              },
              metadata: {
                ...result.metadata,
                remaining: rateLimitResult.remaining,
              },
            })}\n\n`
            controller.enqueue(encoder.encode(finalMessage))
          } catch (enqueueError) {
            console.warn("[Stream] Failed to send final result (controller may be closed):", enqueueError)
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to analyze contributions"

          try {
            const errorData = `data: ${JSON.stringify({
              type: "error",
              error: errorMessage,
            })}\n\n`
            controller.enqueue(encoder.encode(errorData))
          } catch (enqueueError) {
            console.warn("[Stream] Failed to send error (controller may be closed):", enqueueError)
          }
        } finally {
          try {
            controller.close()
          } catch (closeError) {
            // Controller may already be closed, ignore
            console.warn("[Stream] Controller already closed:", closeError)
          }
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    })
  } catch (error) {
    console.error("Stream setup error:", error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
}

