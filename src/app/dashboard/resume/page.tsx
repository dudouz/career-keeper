"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDistance } from "date-fns"
import type { ResumeContent } from "@/lib/db/types"
import { exportResumeToPDF } from "@/lib/export/pdf"
import { exportResumeToTXT } from "@/lib/export/txt"

interface Resume {
  id: string
  title: string
  fileName: string
  fileType: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

interface UploadedResume extends Resume {
  content: ResumeContent
}

export default function ResumePage() {
  const [resumes, setResumes] = useState<Resume[]>([])
  const [activeResume, setActiveResume] = useState<UploadedResume | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchResumes()
  }, [])

  async function fetchResumes() {
    try {
      const response = await fetch("/api/resume/upload")
      const data = await response.json()

      if (response.ok) {
        setResumes(data.resumes)
      }
    } catch {
      // Silent fail for initial load
    } finally {
      setLoading(false)
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setError("")
    setSuccess("")
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/resume/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to upload resume")
        return
      }

      setSuccess("Resume uploaded and parsed successfully!")
      setActiveResume({ ...data.resume, isActive: true, createdAt: new Date(), updatedAt: new Date() })
      await fetchResumes()
      
      // Reset file input
      e.target.value = ""
    } catch {
      setError("An error occurred while uploading")
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Resume Management</h1>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Loading resumes...
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Resume Management</h1>
        <p className="text-muted-foreground">
          Upload and manage your resumes
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
          {success}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Upload Resume</CardTitle>
          <CardDescription>
            Upload your existing resume in DOCX or TXT format (max 5MB) · PDF support coming soon
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <input
              type="file"
              id="resume-upload"
              accept=".docx,.txt,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
            <label htmlFor="resume-upload">
              <Button disabled={uploading} asChild>
                <span className="cursor-pointer">
                  {uploading ? "Uploading..." : "Choose File"}
                </span>
              </Button>
            </label>
            <span className="text-sm text-muted-foreground">
              Accepted formats: DOCX, TXT
            </span>
          </div>

          <div className="rounded-lg bg-muted p-4 text-sm">
            <p className="font-semibold mb-2">What we extract from your resume:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Professional summary/profile</li>
              <li>Work experience and job history</li>
              <li>Projects and portfolio items</li>
              <li>Technical skills and technologies</li>
              <li>Education and certifications</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {(activeResume || resumes.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Your Resumes</CardTitle>
            <CardDescription>
              {resumes.length} resume{resumes.length !== 1 ? "s" : ""} uploaded
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {resumes.map((resume) => (
                <div
                  key={resume.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{resume.title}</p>
                      {resume.isActive && (
                        <Badge variant="default">Active</Badge>
                      )}
                      <Badge variant="secondary">{resume.fileType.toUpperCase()}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {resume.fileName} · Uploaded {formatDistance(new Date(resume.createdAt), new Date(), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeResume && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Parsed Content</CardTitle>
                  <CardDescription>
                    Sections extracted from your resume
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      exportResumeToTXT(
                        activeResume.content,
                        `${activeResume.title.replace(/\s+/g, "-")}.txt`
                      )
                    }
                  >
                    Export TXT
                  </Button>
                  <Button
                    onClick={() =>
                      exportResumeToPDF(
                        activeResume.content,
                        `${activeResume.title.replace(/\s+/g, "-")}.pdf`
                      )
                    }
                  >
                    Export PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
          <CardContent className="space-y-6">
            {activeResume.content.summary && (
              <div>
                <h4 className="font-semibold mb-2">Summary</h4>
                <p className="text-sm text-muted-foreground">{activeResume.content.summary}</p>
              </div>
            )}

            {activeResume.content.experience && activeResume.content.experience.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Experience</h4>
                <div className="space-y-2">
                  {activeResume.content.experience.map((exp, i) => (
                    <div key={i} className="text-sm">
                      <p className="font-medium">{exp.position || exp.company}</p>
                      <p className="text-muted-foreground">{exp.company !== exp.position && exp.company}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeResume.content.skills && activeResume.content.skills.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {activeResume.content.skills.map((skill, i) => (
                    <Badge key={i} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {activeResume.content.education && activeResume.content.education.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Education</h4>
                <div className="space-y-2">
                  {activeResume.content.education.map((edu, i) => (
                    <div key={i} className="text-sm">
                      <p className="font-medium">{edu.degree || edu.institution}</p>
                      <p className="text-muted-foreground">{edu.institution !== edu.degree && edu.institution}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeResume.content.projects && activeResume.content.projects.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Projects</h4>
                <div className="space-y-2">
                  {activeResume.content.projects.map((project, i) => (
                    <div key={i} className="text-sm">
                      <p className="font-medium">{project.name}</p>
                      <p className="text-muted-foreground">{project.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Export Options</CardTitle>
              <CardDescription>
                Download your resume in different formats
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg space-y-2">
                  <h4 className="font-semibold">PDF Format</h4>
                  <p className="text-sm text-muted-foreground">
                    Professional PDF with proper formatting, sections, and page breaks. Best for job applications.
                  </p>
                  <Button
                    className="w-full"
                    onClick={() =>
                      exportResumeToPDF(
                        activeResume.content,
                        `${activeResume.title.replace(/\s+/g, "-")}.pdf`
                      )
                    }
                  >
                    Download PDF
                  </Button>
                </div>

                <div className="p-4 border rounded-lg space-y-2">
                  <h4 className="font-semibold">Plain Text Format</h4>
                  <p className="text-sm text-muted-foreground">
                    Simple text file with clean formatting. Compatible with all systems and ATS scanners.
                  </p>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() =>
                      exportResumeToTXT(
                        activeResume.content,
                        `${activeResume.title.replace(/\s+/g, "-")}.txt`
                      )
                    }
                  >
                    Download TXT
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

