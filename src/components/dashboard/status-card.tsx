"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import { useGitHubStatusQuery, useOpenAIKeyStatusQuery, useResumesQuery, useActiveSnapshotQuery } from "@/lib/api/queries"

export function StatusCard() {
  const { data: githubStatus } = useGitHubStatusQuery()
  const { data: openaiKeyStatus } = useOpenAIKeyStatusQuery()
  const { data: resumesData } = useResumesQuery()
  const { data: snapshotData } = useActiveSnapshotQuery()

  const hasGithub = githubStatus?.connected ?? false
  const hasOpenAIKey = openaiKeyStatus?.hasKey ?? false
  const hasResume = (resumesData?.resumes?.length ?? 0) > 0
  const hasSnapshot = !!snapshotData?.data

  const resume = resumesData?.resumes?.[0]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Setup Status</CardTitle>
        <CardDescription>Current configuration and data status</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {hasGithub ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-sm font-medium">GitHub</span>
            </div>
            <Badge variant={hasGithub ? "default" : "secondary"}>
              {hasGithub ? "Connected" : "Not Connected"}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {hasOpenAIKey ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-sm font-medium">OpenAI API Key</span>
            </div>
            <Badge variant={hasOpenAIKey ? "default" : "secondary"}>
              {hasOpenAIKey ? "Configured" : "Not Configured"}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {hasResume ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-sm font-medium">Resume</span>
            </div>
            <Badge variant={hasResume ? "default" : "secondary"}>
              {hasResume ? "Uploaded" : "Not Uploaded"}
            </Badge>
          </div>

          {hasResume && resume && (
            <div className="ml-6 space-y-1 text-xs text-muted-foreground">
              <p>Last extracted: {resume.updatedAt ? new Date(resume.updatedAt).toLocaleDateString() : "N/A"}</p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {hasSnapshot ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              )}
              <span className="text-sm font-medium">Snapshot</span>
            </div>
            <Badge variant={hasSnapshot ? "default" : "outline"}>
              {hasSnapshot ? "Active" : "None"}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

