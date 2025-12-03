"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useUploadResumeMutation } from "@/lib/api/queries"
import { zodResolver } from "@hookform/resolvers/zod"
import { CheckCircle2, Lightbulb, Loader2, Upload } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { resumeSchema, type ResumeFormData } from "../onboarding-schema"

interface ResumeOnboardingProps {
  onSuccess: () => void
  onSkip: () => void
}

export function ResumeOnboarding({ onSuccess, onSkip }: ResumeOnboardingProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Mutations
  const uploadMutation = useUploadResumeMutation()

  // Form setup
  const {
    setValue,
    handleSubmit,
    formState: { errors },
    trigger,
  } = useForm<ResumeFormData>({
    resolver: zodResolver(resumeSchema),
  })

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setValue("file", file)
      // Trigger validation to show errors immediately
      await trigger("file")
    }
  }

  const handleUploadResume = (data: ResumeFormData) => {
    uploadMutation.mutate(data.file, {
      onSuccess: () => {
        onSuccess()
      },
    })
  }
  return (
    <>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Upload className="h-6 w-6" />
          <CardTitle>Upload Your Resume</CardTitle>
        </div>
        <CardDescription>
          Upload your resume in PDF format (preferred) for the best results
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm dark:border-blue-800 dark:bg-blue-900/20">
          <div className="flex gap-2">
            <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-500" />
            <div>
              <p className="mb-1 font-semibold text-blue-900 dark:text-blue-400">Why PDF?</p>
              <ul className="space-y-1 text-xs text-blue-800 dark:text-blue-500">
                <li className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Preserves formatting and layout
                </li>
                <li className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Best compatibility with AI analysis
                </li>
                <li className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Professional standard for resumes
                </li>
              </ul>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(handleUploadResume)} className="space-y-6">
          <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-center">
            <Upload className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />

            <div className="space-y-2">
              <p className="text-sm font-medium">
                {selectedFile ? (
                  <span className="flex items-center justify-center gap-2">
                    {selectedFile.name}
                    {selectedFile.type === "application/pdf" && (
                      <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                        <CheckCircle2 className="h-3 w-3" /> PDF
                      </Badge>
                    )}
                  </span>
                ) : (
                  "Choose a file or drag it here"
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-primary">PDF recommended</span> · Also accepts
                DOCX, TXT (max 2MB)
              </p>
            </div>

            <input
              type="file"
              onChange={handleFileSelect}
              accept=".pdf,.docx,.txt"
              className="hidden"
              id="resume-upload"
            />
            <label htmlFor="resume-upload">
              <Button type="button" variant="outline" className="mt-4" asChild>
                <span>Select File</span>
              </Button>
            </label>
          </div>

          {(errors.file || uploadMutation.isError) && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {errors.file?.message ||
                (uploadMutation.error instanceof Error
                  ? uploadMutation.error.message
                  : "Failed to upload resume")}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={!selectedFile || uploadMutation.isPending}
              className="flex-1"
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Upload Resume"
              )}
            </Button>
            <Button type="button" onClick={onSkip} variant="outline">
              Skip for now
            </Button>
          </div>
        </form>
      </CardContent>
    </>
  )
}
