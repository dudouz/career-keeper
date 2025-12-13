"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useActiveSnapshotQuery, useResumesQuery, useGenerateSnapshotAnalysisMutation, useUpdateSnapshotMutation, queryKeys } from "@/lib/api/queries"
import { Briefcase, Calendar, Code, Sparkles, FileText, Github, Loader2, AlertCircle, Edit2, Check, X } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { formatDistanceToNow } from "date-fns"

export function SnapshotView() {
  const queryClient = useQueryClient()
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState("")
  const { data: snapshotData, isLoading, refetch } = useActiveSnapshotQuery()
  const { data: resumesData } = useResumesQuery()
  const generateAnalysisMutation = useGenerateSnapshotAnalysisMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.snapshots.active() })
      refetch() // Force refetch to update the UI immediately
    },
  })
  const updateSnapshotMutation = useUpdateSnapshotMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.snapshots.active() })
      refetch()
      setIsEditingTitle(false)
    },
  })

  // Don't show anything while loading or if no snapshot exists
  if (isLoading || !snapshotData?.data) {
    return null // Will show onboarding instead
  }

  const snapshot = snapshotData.data as any

  const resumeData = snapshot.resumeData as any
  const githubAnalysis = snapshot.githubAnalysis as any
  const githubContributionsData = snapshot.githubContributionsData as any
  
  // Check if we have GitHub data (either contributions data or contribution ID)
  const hasGitHubData = !!(
    githubContributionsData?.data ||
    snapshot.githubContributionId ||
    githubContributionsData
  )
  // Check if analysis exists - it can be in consolidatedReport.aggregatedInsights or directly in aggregatedInsights
  const hasAnalysis = !!githubAnalysis && (
    (githubAnalysis.consolidatedReport && githubAnalysis.consolidatedReport.aggregatedInsights) ||
    githubAnalysis.aggregatedInsights
  )

  // Initialize edited title when snapshot loads
  const displayTitle = snapshot.title || `Snapshot ${new Date(snapshot.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
  
  const handleStartEdit = () => {
    setEditedTitle(displayTitle)
    setIsEditingTitle(true)
  }

  const handleSaveTitle = () => {
    if (editedTitle.trim()) {
      updateSnapshotMutation.mutate({
        snapshotId: snapshot.id,
        title: editedTitle.trim(),
      })
    } else {
      setIsEditingTitle(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditingTitle(false)
    setEditedTitle("")
  }

  return (
    <div className="space-y-6">
      <Card className="border-primary">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {isEditingTitle ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveTitle()
                      if (e.key === "Escape") handleCancelEdit()
                    }}
                    className="text-2xl font-bold h-10"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleSaveTitle}
                    disabled={updateSnapshotMutation.isPending}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCancelEdit}
                    disabled={updateSnapshotMutation.isPending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <CardTitle className="text-2xl flex items-center gap-2 group">
                  <Sparkles className="h-6 w-6" />
                  {displayTitle}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleStartEdit}
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                </CardTitle>
              )}
              <CardDescription className="mt-2">
                Created {formatDistanceToNow(new Date(snapshot.createdAt), { addSuffix: true })} • Your complete career profile
              </CardDescription>
            </div>
            <Badge variant="default">Active</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Career Summary */}
          <div className="grid gap-4 md:grid-cols-3">
            {snapshot.yearsOfExperience && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                <Briefcase className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Experience</p>
                  <p className="text-lg font-semibold">{snapshot.yearsOfExperience} years</p>
                </div>
              </div>
            )}
            {snapshot.seniority && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Seniority</p>
                  <p className="text-lg font-semibold capitalize">{snapshot.seniority}</p>
                </div>
              </div>
            )}
            {snapshot.focus && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                <Code className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Focus</p>
                  <p className="text-lg font-semibold capitalize">{snapshot.focus}</p>
                </div>
              </div>
            )}
          </div>

          {/* Resume Summary */}
          {resumeData && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Resume Data
              </h3>
              <div className="space-y-2 text-sm">
                {resumeData.name && <p><span className="font-medium">Name:</span> {resumeData.name}</p>}
                {resumeData.email && <p><span className="font-medium">Email:</span> {resumeData.email}</p>}
                {resumeData.sections && (
                  <p>
                    <span className="font-medium">Experience Sections:</span> {resumeData.sections.length}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* GitHub Analysis Summary or Pending State */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Github className="h-5 w-5" />
              GitHub Analysis
            </h3>
            {hasAnalysis ? (
              (() => {
                // Get aggregatedInsights from either consolidatedReport or directly
                const aggregatedInsights = githubAnalysis?.consolidatedReport?.aggregatedInsights || githubAnalysis?.aggregatedInsights
                return aggregatedInsights ? (
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-medium">Total Analyzed Contributions:</span>{" "}
                      {aggregatedInsights.totalContributions}
                    </p>
                    {aggregatedInsights.topTechnologies && (
                      <p>
                        <span className="font-medium">Top Technologies:</span>{" "}
                        {aggregatedInsights.topTechnologies
                          .slice(0, 5)
                          .map((t: any) => t.name)
                          .join(", ")}
                      </p>
                    )}
                  </div>
                ) : null
              })()
            ) : hasGitHubData || snapshot.githubContributionId ? (
              <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                <AlertDescription className="text-amber-900 dark:text-amber-400">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-sm">AI Analysis Pending - Generate analysis to view insights</span>
                    <Button
                      size="sm"
                      onClick={() => generateAnalysisMutation.mutate({ snapshotId: snapshot.id })}
                      disabled={generateAnalysisMutation.isPending}
                      className="shrink-0"
                    >
                      {generateAnalysisMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-3 w-3" />
                          Generate Analysis
                        </>
                      )}
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
                <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-500" />
                <AlertDescription className="text-blue-900 dark:text-blue-400">
                  <span className="text-sm">No GitHub data in this snapshot. Connect GitHub and create a new snapshot to analyze contributions.</span>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

