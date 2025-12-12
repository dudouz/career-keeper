import { auth } from "@/auth";
import { rateLimit } from "@/lib/rate-limit";
import { analyzeContributionsWithAgent } from "@/lib/services/agents";
import { NextRequest, NextResponse } from "next/server";

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  maxRequests: 5, // Lower limit for AI-intensive operations
});

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting
    const rateLimitResult = limiter.check(session.user.email);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { contributions, options } = body;

    // Contributions are optional - service will fetch from DB if not provided
    // Analyze contributions using service
    const result = await analyzeContributionsWithAgent({
      userId: session.user.id,
      contributions: contributions || undefined,
      options,
    });

    return NextResponse.json({
      success: true,
      data: {
        consolidatedReport: result.consolidatedReport,
        richAnalysis: result.richAnalysis,
      },
      metadata: {
        ...result.metadata,
        remaining: rateLimitResult.remaining,
      },
    });
  } catch (error) {
    console.error("Chain of Density pipeline error:", error);

    // Handle specific error messages from service
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to analyze contributions";
    let statusCode = 500;

    if (
      errorMessage.includes("API key not found") ||
      errorMessage.includes("not configured")
    ) {
      statusCode = 400;
    } else if (
      errorMessage.includes("Invalid") ||
      errorMessage.includes("decrypt")
    ) {
      statusCode = 401;
    } else if (
      errorMessage.includes("quota") ||
      errorMessage.includes("rate")
    ) {
      statusCode = 429;
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
