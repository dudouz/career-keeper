"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  useDeleteResumeMutation,
  useReprocessResumeMutation,
  useResumesQuery,
  useUploadResumeMutation,
} from "@/lib/api/queries"
import type { Resume as DBResume, ResumeSection } from "@/lib/db/types"
import { formatDistance } from "date-fns"
import {
  AlertCircle,
  Briefcase,
  CheckCircle,
  FileText,
  Github,
  Globe,
  Linkedin,
  Loader2,
  Mail,
  MoreVertical,
  Phone,
  RefreshCw,
  Trash2,
  Upload,
  User,
} from "lucide-react"
import { useState } from "react"

interface ResumeWithSections extends DBResume {
  sections?: ResumeSection[]
}

export function ResumePage() {
  const { data: resumesData, isLoading: loading } = useResumesQuery()
  const {
    mutate: uploadResume,
    isPending: isUploading,
    isError: isUploadingError,
    isSuccess: isUploadingSuccess,
    error: uploadError,
  } = useUploadResumeMutation()
  const { mutate: reprocessResume, isPending: isReprocessing } = useReprocessResumeMutation()
  const { mutate: deleteResume, isPending: isDeleting } = useDeleteResumeMutation()
  const [selectedResume, setSelectedResume] = useState<ResumeWithSections | null>(null)
  const [resumeToDelete, setResumeToDelete] = useState<ResumeWithSections | null>(null)

  const resumes = (resumesData?.resumes || []) as ResumeWithSections[]

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    uploadResume(file, {
      onSuccess: (data) => {
        setSelectedResume(data.resume as ResumeWithSections)
        e.target.value = ""
      },
    })
  }

  // Auto-select active resume or first resume
  const displayResume = selectedResume || resumes.find((r) => r.isActive) || resumes[0]

  const handleDeleteConfirm = () => {
    if (!resumeToDelete) return
    deleteResume(resumeToDelete.id, {
      onSuccess: () => {
        if (selectedResume?.id === resumeToDelete.id) {
          setSelectedResume(null)
        }
        setResumeToDelete(null)
      },
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Resume Management</h1>
        <Card>
          <CardContent className="py-8 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
            <p className="mt-2 text-muted-foreground">Loading resumes...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <ConfirmationDialog
        open={!!resumeToDelete}
        onOpenChange={(open) => {
          if (!open) setResumeToDelete(null)
        }}
        title="Delete Resume"
        description="Are you sure you want to delete this resume? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />

      <div>
        <h1 className="text-3xl font-bold">Resume Management</h1>
        <p className="text-muted-foreground">Upload and manage your resumes</p>
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
          <AlertDescription>Resume uploaded and parsed successfully!</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            <CardTitle>Upload Resume</CardTitle>
          </div>
          <CardDescription>
            Upload your existing resume in PDF (recommended), DOCX, or TXT format (max 5MB)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <input
              type="file"
              id="resume-upload"
              accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
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
              Accepted formats: PDF (recommended), DOCX, TXT
            </span>
          </div>

          <div className="rounded-lg bg-muted p-4 text-sm">
            <p className="mb-2 font-semibold">What we extract from your resume:</p>
            <ul className="space-y-1 text-muted-foreground">
              <li className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Contact information (name, email, phone, links)
              </li>
              <li className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Professional summary
              </li>
              <li className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Work experience with dates, positions, and descriptions
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {resumes.length > 0 && (
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
                  className={`flex items-center justify-between rounded-lg border p-4 transition-colors ${
                    displayResume?.id === resume.id
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <div
                    className="flex flex-1 cursor-pointer items-center gap-3"
                    onClick={() => setSelectedResume(resume)}
                  >
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{resume.title}</p>
                        {resume.isActive && <Badge variant="default">Active</Badge>}
                        {resume.fileType && (
                          <Badge variant="secondary">{resume.fileType.toUpperCase()}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {resume.fileName} · Uploaded{" "}
                        {formatDistance(new Date(resume.createdAt), new Date(), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedResume(resume)
                          reprocessResume(resume.id)
                        }}
                        disabled={isReprocessing}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Re-extract Data
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setResumeToDelete(resume)
                        }}
                        disabled={isDeleting}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {displayResume && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Extracted Data</CardTitle>
                <CardDescription>Structured information from your resume</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => reprocessResume(displayResume.id)}
                disabled={isReprocessing}
              >
                {isReprocessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Re-extract Data
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Contact Information */}
            <div>
              <h4 className="mb-3 flex items-center gap-2 font-semibold">
                <User className="h-4 w-4" />
                Contact Information
              </h4>
              <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                {displayResume.name && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{displayResume.name}</span>
                  </div>
                )}
                {displayResume.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{displayResume.email}</span>
                  </div>
                )}
                {displayResume.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{displayResume.phone}</span>
                  </div>
                )}
                {displayResume.git && (
                  <div className="flex items-center gap-2">
                    <Github className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={displayResume.git}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      GitHub Profile
                    </a>
                  </div>
                )}
                {displayResume.linkedin && (
                  <div className="flex items-center gap-2">
                    <Linkedin className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={displayResume.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      LinkedIn Profile
                    </a>
                  </div>
                )}
                {displayResume.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={displayResume.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Personal Website
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Summary */}
            {displayResume.summary && (
              <div>
                <h4 className="mb-2 flex items-center gap-2 font-semibold">
                  <FileText className="h-4 w-4" />
                  Professional Summary
                </h4>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {displayResume.summary}
                </p>
              </div>
            )}

            {/* Work Experience Sections */}
            {displayResume.sections && displayResume.sections.length > 0 && (
              <div>
                <h4 className="mb-3 flex items-center gap-2 font-semibold">
                  <Briefcase className="h-4 w-4" />
                  Work Experience ({displayResume.sections.length})
                </h4>
                <div className="space-y-4">
                  {displayResume.sections.map((section) => (
                    <div key={section.id} className="border-l-2 border-primary/20 py-2 pl-4">
                      <div className="mb-1 flex items-start justify-between">
                        <div>
                          <h5 className="font-semibold">{section.position}</h5>
                          <p className="text-sm text-muted-foreground">{section.company}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {section.startDate} - {section.endDate || "Present"}
                        </Badge>
                      </div>
                      {section.description && (
                        <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                          {section.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {!displayResume.name &&
              !displayResume.email &&
              !displayResume.summary &&
              (!displayResume.sections || displayResume.sections.length === 0) && (
                <div className="py-8 text-center text-muted-foreground">
                  <FileText className="mx-auto mb-2 h-12 w-12 opacity-50" />
                  <p>No structured data extracted yet.</p>
                  <p className="text-sm">Upload a resume to see extracted information here.</p>
                </div>
              )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
