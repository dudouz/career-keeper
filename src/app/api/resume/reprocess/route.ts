import { auth } from "@/auth"
import { db } from "@/lib/db"
import { resumes, resumeSections } from "@/lib/db/schema"
import { parseResumeFile } from "@/lib/resume/parser"
import { eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { resumeId } = await request.json()

    if (!resumeId) {
      return NextResponse.json({ error: "Resume ID is required" }, { status: 400 })
    }

    // Get the resume
    const resume = await db.query.resumes.findFirst({
      where: (resumes, { eq, and }) =>
        and(eq(resumes.id, resumeId), eq(resumes.userId, session.user.id)),
    })

    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 })
    }

    // Re-parse from the file URL (base64 encoded)
    if (!resume.fileUrl) {
      return NextResponse.json({ error: "Resume has no file to reprocess" }, { status: 400 })
    }

    // Extract base64 data from data URL
    const base64Data = resume.fileUrl.split(",")[1]
    if (!base64Data) {
      return NextResponse.json({ error: "Invalid file URL format" }, { status: 400 })
    }

    const buffer = Buffer.from(base64Data, "base64")
    const fileType =
      resume.fileType === "pdf"
        ? "application/pdf"
        : resume.fileType === "docx"
          ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          : "text/plain"

    const parsed = await parseResumeFile(buffer, fileType)

    // Delete old sections
    await db.delete(resumeSections).where(eq(resumeSections.resumeId, resumeId))

    // Update resume with new structured data
    await db
      .update(resumes)
      .set({
        name: parsed.header.name || null,
        email: parsed.header.email || null,
        phone: parsed.header.phone || null,
        git: parsed.header.git || null,
        linkedin: parsed.header.linkedin || null,
        website: parsed.header.website || null,
        summary: parsed.summary || null,
        updatedAt: new Date(),
      })
      .where(eq(resumes.id, resumeId))

    // Insert new sections
    if (parsed.sections.length > 0) {
      await db.insert(resumeSections).values(
        parsed.sections.map((section) => ({
          resumeId: resume.id,
          startDate: section.start,
          endDate: section.end,
          position: section.position,
          company: section.company,
          description: section.description,
          displayOrder: section.displayOrder,
        }))
      )
    }

    // Fetch updated resume with sections
    const updatedResume = await db.query.resumes.findFirst({
      where: (resumes, { eq }) => eq(resumes.id, resumeId),
      with: {
        sections: {
          orderBy: (sections, { asc }) => [asc(sections.displayOrder)],
        },
      },
    })

    return NextResponse.json({
      success: true,
      resume: updatedResume,
      message: "Resume reprocessed successfully",
    })
  } catch (error) {
    console.error("Resume reprocess error:", error)
    return NextResponse.json({ error: "Failed to reprocess resume" }, { status: 500 })
  }
}
