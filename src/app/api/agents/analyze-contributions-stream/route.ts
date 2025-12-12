import { auth } from "@/auth";
import { rateLimit } from "@/lib/rate-limit";
import { analyzeContributionsWithAgent } from "@/lib/services/agents";
import { NextRequest } from "next/server";

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  maxRequests: 5, // Lower limit for AI-intensive operations
});

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id || !session?.user?.email) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Rate limiting
    const rateLimitResult = limiter.check(session.user.email);
    if (!rateLimitResult.success) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
        {
          status: 429,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body
    const body = await req.json();
    const { contributions, options } = body;

    // Create a ReadableStream for SSE
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        const sendProgress = (data: {
          step: "step1" | "step2" | "step3" | "consolidated";
          current: number;
          total: number;
          message: string;
        }) => {
          const message = `data: ${JSON.stringify({ type: "progress", ...data })}\n\n`;
          controller.enqueue(encoder.encode(message));
        };

        try {
          // Analyze contributions with progress callbacks
          const result = await analyzeContributionsWithAgent({
            userId: session.user.id,
            contributions: contributions || undefined,
            options: {
              ...options,
              onProgress: sendProgress,
            },
          });

          // Send final result
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
          })}\n\n`;
          controller.enqueue(encoder.encode(finalMessage));
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to analyze contributions";
          
          const errorData = `data: ${JSON.stringify({
            type: "error",
            error: errorMessage,
          })}\n\n`;
          controller.enqueue(encoder.encode(errorData));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Stream setup error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

