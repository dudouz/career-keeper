"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatDistance } from "date-fns"
import type { ResumeContent } from "@/lib/db/types"
import { exportResumeToPDF } from "@/lib/export/pdf"
import { exportResumeToTXT } from "@/lib/export/txt"
import {
  FileText,
  Upload,
  Loader2,
  AlertCircle,
  CheckCircle,
  FileDown,
  Briefcase,
  GraduationCap,
  Code,
  FolderGit2,
} from "lucide-react"
import { useResumesQuery, useUploadResumeMutation } from "@/lib/api/queries"

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

export function ResumePage() {
  const { data: resumesData, isLoading: loading } = useResumesQuery()
  const { mutate: uploadResume, isPending: isUploading, isError: isUploadingError, isSuccess: isUploadingSuccess, error: uploadError } = useUploadResumeMutation()
  const [activeResume, setActiveResume] = useState<UploadedResume | null>(null)

  const resumes = (resumesData?.resumes || []) as Resume[]

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    uploadResume(file, {
      onSuccess: (data) => {
        setActiveResume({
          ...data.resume,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        } as UploadedResume)
        e.target.value = ""
      },
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Resume Management</h1>
        <Card>
          <CardContent className="py-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-muted-foreground mt-2">Loading resumes...</p>
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

      {isUploadingError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {uploadError instanceof Error ? uploadError.message : "Failed to upload resume"}
          </AlertDescription>
        </Alert>
      )}

      {isUploadingSuccess && (
        <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-900/20 dark:text-green-400">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Resume uploaded and parsed successfully!
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            <CardTitle>Upload Resume</CardTitle>
          </div>
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
              disabled={isUploading}
              className="hidden"
            />
            <label htmlFor="resume-upload">
              <Button disabled={isUploading} asChild>
                <span className="cursor-pointer">
                  {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isUploading ? "Uploading..." : "Choose File"}
                </span>
              </Button>
            </label>
            <span className="text-sm text-muted-foreground">
              Accepted formats: DOCX, TXT
            </span>
          </div>

          <div className="rounded-lg bg-muted p-4 text-sm">
            <p className="font-semibold mb-2">What we extract from your resume:</p>
            <ul className="space-y-1 text-muted-foreground">
              <li className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Professional summary/profile
              </li>
              <li className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Work experience and job history
              </li>
              <li className="flex items-center gap-2">
                <FolderGit2 className="h-4 w-4" />
                Projects and portfolio items
              </li>
              <li className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                Technical skills and technologies
              </li>
              <li className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Education and certifications
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {(activeResume || resumes.length > 0) && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <CardTitle>Your Resumes</CardTitle>
            </div>
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
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
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
                    size="sm"
                    onClick={() =>
                      exportResumeToTXT(
                        activeResume.content,
                        `${activeResume.title.replace(/\s+/g, "-")}.txt`
                      )
                    }
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    TXT
                  </Button>
                  <Button
                    size="sm"
                    onClick={() =>
                      exportResumeToPDF(
                        activeResume.content,
                        `${activeResume.title.replace(/\s+/g, "-")}.pdf`
                      )
                    }
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
          <CardContent className="space-y-6">
            {activeResume.content.summary && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <h4 className="font-semibold">Summary</h4>
                </div>
                <p className="text-sm text-muted-foreground">{activeResume.content.summary}</p>
              </div>
            )}

            {activeResume.content.experience && activeResume.content.experience.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <h4 className="font-semibold">Experience</h4>
                </div>
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
                <div className="flex items-center gap-2 mb-2">
                  <Code className="h-4 w-4 text-muted-foreground" />
                  <h4 className="font-semibold">Skills</h4>
                </div>
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
                <div className="flex items-center gap-2 mb-2">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  <h4 className="font-semibold">Education</h4>
                </div>
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
                <div className="flex items-center gap-2 mb-2">
                  <FolderGit2 className="h-4 w-4 text-muted-foreground" />
                  <h4 className="font-semibold">Projects</h4>
                </div>
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
              <div className="flex items-center gap-2">
                <FileDown className="h-5 w-5" />
                <CardTitle>Export Options</CardTitle>
              </div>
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
                    <FileDown className="mr-2 h-4 w-4" />
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
                    <FileDown className="mr-2 h-4 w-4" />
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
