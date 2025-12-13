"use client"

import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSnapshotByIdQuery, useUpdateSnapshotMutation, useGenerateSnapshotAnalysisMutation, queryKeys } from "@/lib/api/queries"
import { 
  Briefcase, 
  Calendar, 
  Code, 
  Sparkles, 
  FileText, 
  Github, 
  Loader2, 
  AlertCircle, 
  Edit2, 
  Check, 
  X,
  ArrowLeft,
  Trash2
} from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { Input } from "@/components/ui/input"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { useDeactivateSnapshotMutation } from "@/lib/api/queries"
import { MarkdownRenderer } from "@/components/agents/markdown-renderer"

export function SnapshotDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const snapshotId = params.id as string
  
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  
  const { data: snapshotData, isLoading, refetch } = useSnapshotByIdQuery(snapshotId)
  const updateSnapshotMutation = useUpdateSnapshotMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.snapshots.detail(snapshotId) })
      refetch()
      setIsEditingTitle(false)
    },
  })
  
  const generateAnalysisMutation = useGenerateSnapshotAnalysisMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.snapshots.detail(snapshotId) })
      refetch()
    },
  })
  
  const deleteSnapshotMutation = useDeactivateSnapshotMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.snapshots.all })
      router.push("/dashboard/snapshots")
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="ml-3 text-lg text-muted-foreground">Loading snapshot...</p>
      </div>
    )
  }

  if (!snapshotData?.data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Snapshot not found</AlertDescription>
      </Alert>
    )
  }

  const snapshot = snapshotData.data as any
  const resumeData = snapshot.resumeData as any
  const githubAnalysis = snapshot.githubAnalysis as any
  const githubContributionsData = snapshot.githubContributionsData as any
  
  // Extract GitHub contributions data
  const contributionsData = githubContributionsData?.data || githubContributionsData
  
  // Check if we have GitHub data
  const hasGitHubData = !!(
    contributionsData ||
    snapshot.githubContributionId ||
    githubContributionsData
  )
  
  // Check if we have analysis
  const hasAnalysis = !!githubAnalysis?.consolidatedReport?.aggregatedInsights

  // Initialize title editing
  if (isEditingTitle && editedTitle === "") {
    setEditedTitle(snapshot.title || "")
  }

  const handleTitleSave = () => {
    if (editedTitle.trim() && editedTitle !== snapshot.title) {
      updateSnapshotMutation.mutate({
        snapshotId: snapshot.id,
        title: editedTitle.trim(),
      })
    } else {
      setIsEditingTitle(false)
      setEditedTitle("")
    }
  }

  const handleTitleCancel = () => {
    setIsEditingTitle(false)
    setEditedTitle("")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/snapshots")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Snapshots
          </Button>
          <div>
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="text-2xl font-bold"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleTitleSave()
                    if (e.key === "Escape") handleTitleCancel()
                  }}
                  autoFocus
                />
                <Button size="sm" onClick={handleTitleSave}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={handleTitleCancel}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold">{snapshot.title || "Snapshot"}</h1>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingTitle(true)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
            )}
            <p className="text-muted-foreground">
              Created {formatDistanceToNow(new Date(snapshot.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {snapshot.isActive && <Badge>Active</Badge>}
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Tabs for different sections */}
      <Card>
        <Tabs defaultValue="resume" className="w-full">
          <CardHeader>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="resume" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Resume
              </TabsTrigger>
              <TabsTrigger value="github" className="flex items-center gap-2">
                <Github className="h-4 w-4" />
                GitHub
              </TabsTrigger>
              <TabsTrigger value="analysis" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                AI Analysis
              </TabsTrigger>
            </TabsList>
          </CardHeader>

          {/* Resume Data Tab */}
          <TabsContent value="resume">
            <CardContent>
              {resumeData ? (
                <div className="space-y-6">
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
                  
                  {resumeData.sections && resumeData.sections.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Experience Sections</h3>
                      <div className="space-y-3">
                        {resumeData.sections.map((section: any, index: number) => (
                          <Card key={index} className="bg-muted/50">
                            <CardContent className="pt-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-medium">{section.position || "Position"}</p>
                                  <p className="text-sm text-muted-foreground">{section.company || "Company"}</p>
                                  {(section.startDate || section.endDate) && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {section.startDate} - {section.endDate || "Present"}
                                    </p>
                                  )}
                                </div>
                              </div>
                              {section.description && (
                                <p className="text-sm mt-2 text-muted-foreground">{section.description}</p>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No resume data available for this snapshot.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </TabsContent>

          {/* GitHub Contributions Tab */}
          <TabsContent value="github">
            <CardContent>
              {hasGitHubData && contributionsData ? (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-5">
                    <div className="md:col-span-5">
                      <p className="text-sm text-muted-foreground">Total Contributions</p>
                      <p className="text-3xl font-bold">
                        {contributionsData.totalContributions ?? 
                         (contributionsData.commits?.length || 0) + 
                         (contributionsData.pullRequests?.length || 0) + 
                         (contributionsData.issues?.length || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Repositories</p>
                      <p className="text-2xl font-bold">{contributionsData.repositories?.length || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Commits</p>
                      <p className="text-2xl font-bold">{contributionsData.commits?.length || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Pull Requests</p>
                      <p className="text-2xl font-bold">{contributionsData.pullRequests?.length || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Issues</p>
                      <p className="text-2xl font-bold">{contributionsData.issues?.length || 0}</p>
                    </div>
                  </div>
                  
                  {contributionsData.repositories && contributionsData.repositories.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Repositories</h3>
                      <div className="flex flex-wrap gap-2">
                        {contributionsData.repositories.slice(0, 10).map((repo: any, index: number) => (
                          <Badge key={index} variant="outline">
                            {repo.name}
                          </Badge>
                        ))}
                        {contributionsData.repositories.length > 10 && (
                          <Badge variant="outline">
                            +{contributionsData.repositories.length - 10} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No GitHub contributions data available for this snapshot.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </TabsContent>

          {/* AI Analysis Tab */}
          <TabsContent value="analysis">
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">AI Analysis</h3>
                  <p className="text-sm text-muted-foreground">
                    AI-powered analysis of your GitHub contributions
                  </p>
                </div>
                {!hasAnalysis && hasGitHubData && (
                  <Button
                    onClick={() => generateAnalysisMutation.mutate({ snapshotId: snapshot.id })}
                    disabled={generateAnalysisMutation.isPending}
                    size="sm"
                  >
                    {generateAnalysisMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Analysis
                      </>
                    )}
                  </Button>
                )}
              </div>

              {hasAnalysis ? (
                <div className="space-y-6">
                  {githubAnalysis.consolidatedReport?.overallSummary && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Overall Summary</h3>
                      <MarkdownRenderer content={githubAnalysis.consolidatedReport.overallSummary} />
                    </div>
                  )}
                  
                  {githubAnalysis.consolidatedReport?.aggregatedInsights && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Key Insights</h3>
                      <div className="space-y-3">
                        {githubAnalysis.consolidatedReport.aggregatedInsights.topTechnologies && 
                         githubAnalysis.consolidatedReport.aggregatedInsights.topTechnologies.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Top Technologies</p>
                            <div className="flex flex-wrap gap-2">
                              {githubAnalysis.consolidatedReport.aggregatedInsights.topTechnologies
                                .slice(0, 10)
                                .map((tech: any, index: number) => (
                                  <Badge key={index} variant="secondary">
                                    {tech.name} ({tech.count})
                                  </Badge>
                                ))}
                            </div>
                          </div>
                        )}
                        
                        {githubAnalysis.consolidatedReport.aggregatedInsights.keyAchievements && 
                         githubAnalysis.consolidatedReport.aggregatedInsights.keyAchievements.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Key Achievements</p>
                            <ul className="list-disc list-inside space-y-1">
                              {githubAnalysis.consolidatedReport.aggregatedInsights.keyAchievements
                                .slice(0, 5)
                                .map((achievement: string, index: number) => (
                                  <li key={index} className="text-sm">{achievement}</li>
                                ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {githubAnalysis.consolidatedReport?.individualReports && 
                   githubAnalysis.consolidatedReport.individualReports.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Individual Reports</h3>
                      <div className="space-y-4">
                        {githubAnalysis.consolidatedReport.individualReports
                          .slice(0, 5)
                          .map((report: any, index: number) => (
                            <Card key={index} className="bg-muted/50">
                              <CardContent className="pt-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline">
                                    {report.contributionMetadata?.type?.toUpperCase() || "CONTRIBUTION"}
                                  </Badge>
                                  {report.contributionMetadata?.title && (
                                    <span className="text-sm font-medium">{report.contributionMetadata.title}</span>
                                  )}
                                </div>
                                {report.markdownReport && (
                                  <MarkdownRenderer content={report.markdownReport} />
                                )}
                              </CardContent>
                            </Card>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : hasGitHubData ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No analysis available yet. Click "Generate Analysis" to create an AI-powered analysis of your GitHub contributions.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No GitHub contributions data found in this snapshot.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Snapshot?"
        description="This will deactivate this snapshot. You can create a new one anytime. This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={() => {
          deleteSnapshotMutation.mutate({ snapshotId: snapshot.id })
        }}
      />
    </div>
  )
}

