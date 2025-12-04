"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import {
  useCompareResumeWithContributionsMutation,
  useGitHubContributionsQuery,
  useGitHubStatusQuery,
} from "@/lib/api/queries"
import {
  AlertCircle,
  CheckCircle,
  Clock,
  FileDown,
  FileText,
  GitCompare,
  Loader2,
  RefreshCw,
  Sparkles,
  XCircle,
} from "lucide-react"
import { useState } from "react"

interface ComparisonData {
  missingAchievements: string[]
  outdatedSections: string[]
  suggestions: string[]
}

interface SectionChange {
  id: string
  type: "missing" | "outdated" | "suggestion"
  content: string
  accepted: boolean | null
}

export function ResumeComparePage() {
  const { data: statusData } = useGitHubStatusQuery()
  const isConnected = statusData?.connected || false
  const { data: contributionsData, isLoading: loadingContributions } = useGitHubContributionsQuery({
    enabled: isConnected, // Only fetch when GitHub is connected
  })
  const {
    mutate: compareResume,

    isPending: isComparing,
    isError: isComparingError,
    error: comparingError,
  } = useCompareResumeWithContributionsMutation()

  const [comparison, setComparison] = useState<ComparisonData | null>(null)
  const [changes, setChanges] = useState<SectionChange[]>([])
  const [existingResume, setExistingResume] = useState("")

  const contributions = contributionsData?.contributions

  const handleCompare = async () => {
    if (!existingResume.trim() || !contributions) {
      return
    }

    compareResume(
      {
        existingResume,
        contributions,
      },
      {
        onSuccess: (data) => {
          setComparison(data)

          console.log(data, "comparison data")

          // Convert comparison data to changes
          const newChanges: SectionChange[] = [
            ...data.missingAchievements.map((achievement: string, index: number) => ({
              id: `missing-${index}`,
              type: "missing" as const,
              content: achievement,
              accepted: null,
            })),
            ...data.outdatedSections.map((section: string, index: number) => ({
              id: `outdated-${index}`,
              type: "outdated" as const,
              content: section,
              accepted: null,
            })),
            ...data.suggestions.map((suggestion: string, index: number) => ({
              id: `suggestion-${index}`,
              type: "suggestion" as const,
              content: suggestion,
              accepted: null,
            })),
          ]
          setChanges(newChanges)
        },
      }
    )
  }

  const handleAccept = (id: string) => {
    setChanges((prev) =>
      prev.map((change) => (change.id === id ? { ...change, accepted: true } : change))
    )
  }

  const handleReject = (id: string) => {
    setChanges((prev) =>
      prev.map((change) => (change.id === id ? { ...change, accepted: false } : change))
    )
  }

  const exportAcceptedChanges = () => {
    const accepted = changes.filter((c) => c.accepted === true)

    let markdown = "# Resume Update Recommendations\n\n"
    markdown += `Generated on ${new Date().toLocaleDateString()}\n\n`

    const byType = accepted.reduce(
      (acc, change) => {
        if (!acc[change.type]) acc[change.type] = []
        acc[change.type].push(change.content)
        return acc
      },
      {} as Record<string, string[]>
    )

    if (byType.missing) {
      markdown += "## Missing Achievements\n\n"
      byType.missing.forEach((item) => {
        markdown += `- ${item}\n`
      })
      markdown += "\n"
    }

    if (byType.outdated) {
      markdown += "## Outdated Sections\n\n"
      byType.outdated.forEach((item) => {
        markdown += `- ${item}\n`
      })
      markdown += "\n"
    }

    if (byType.suggestion) {
      markdown += "## Suggestions\n\n"
      byType.suggestion.forEach((item) => {
        markdown += `- ${item}\n`
      })
      markdown += "\n"
    }

    // Download
    const blob = new Blob([markdown], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `resume-updates-${new Date().toISOString().split("T")[0]}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const stats = {
    total: changes.length,
    accepted: changes.filter((c) => c.accepted === true).length,
    rejected: changes.filter((c) => c.accepted === false).length,
    pending: changes.filter((c) => c.accepted === null).length,
  }

  if (loadingContributions) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Resume Comparison</h1>
          <p className="text-muted-foreground">
            AI-powered analysis of your resume vs GitHub activity
          </p>
        </div>
        <Card>
          <CardContent className="py-8 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
            <p className="mt-2 text-muted-foreground">Loading contributions...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <GitCompare className="h-8 w-8" />
            Resume Comparison
          </h1>
          <p className="text-muted-foreground">
            AI-powered analysis of your resume vs GitHub activity
          </p>
        </div>
        {comparison && (
          <Button onClick={exportAcceptedChanges} disabled={stats.accepted === 0}>
            <FileDown className="mr-2 h-4 w-4" />
            Export Accepted ({stats.accepted})
          </Button>
        )}
      </div>

      {/* Resume Input */}
      {!comparison && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <CardTitle>Paste Your Current Resume</CardTitle>
            </div>
            <CardDescription>
              Paste your resume text below to compare with GitHub contributions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={existingResume}
              onChange={(e) => setExistingResume(e.target.value)}
              placeholder="Paste your resume content here..."
              rows={15}
              className="resize-y"
            />
            {isComparingError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {comparingError instanceof Error
                    ? comparingError.message
                    : "Failed to compare resume"}
                </AlertDescription>
              </Alert>
            )}
            {!contributions && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No GitHub data found. Please connect your GitHub account first.
                </AlertDescription>
              </Alert>
            )}
            <Button
              onClick={handleCompare}
              disabled={isComparing || !existingResume.trim() || !contributions}
              className="w-full"
            >
              {isComparing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Compare with GitHub
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Comparison Results */}
      {comparison && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Total Changes</CardTitle>
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-green-600">Accepted</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-red-600">Rejected</CardTitle>
                  <XCircle className="h-4 w-4 text-red-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-yellow-600">Pending</CardTitle>
                  <Clock className="h-4 w-4 text-yellow-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              </CardContent>
            </Card>
          </div>

          {/* Split View */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Left: Original Resume */}
            <Card>
              <CardHeader>
                <CardTitle>Current Resume</CardTitle>
                <CardDescription>Your existing resume content</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-h-[600px] max-w-none overflow-y-auto whitespace-pre-wrap rounded-lg bg-muted p-4 text-sm">
                  {existingResume}
                </div>
              </CardContent>
            </Card>

            {/* Right: Suggested Changes */}
            <Card>
              <CardHeader>
                <CardTitle>Suggested Changes</CardTitle>
                <CardDescription>Based on your GitHub contributions</CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                {changes.length === 0 ? (
                  <div className="py-8 text-center">
                    <CheckCircle className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
                    <p className="text-muted-foreground">No changes suggested</p>
                  </div>
                ) : (
                  changes.map((change) => {
                    // Determine change card styling
                    let cardStyle = "bg-background"
                    if (change.accepted === true) {
                      cardStyle =
                        "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                    } else if (change.accepted === false) {
                      cardStyle = "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
                    }

                    // Determine badge variant
                    const badgeVariant =
                      change.type === "missing"
                        ? "default"
                        : change.type === "outdated"
                          ? "destructive"
                          : "secondary"

                    // Determine badge label
                    const badgeLabel =
                      change.type === "missing"
                        ? "Missing"
                        : change.type === "outdated"
                          ? "Outdated"
                          : "Suggestion"

                    return (
                      <div
                        key={change.id}
                        className={`space-y-3 rounded-lg border p-4 ${cardStyle}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <Badge variant={badgeVariant}>{badgeLabel}</Badge>
                          {change.accepted !== null && (
                            <Badge variant={change.accepted ? "default" : "outline"}>
                              {change.accepted ? "Accepted" : "Rejected"}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm">{change.content}</p>
                        {change.accepted === null && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleAccept(change.id)}
                              variant="default"
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleReject(change.id)}
                              variant="outline"
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-center gap-4">
                <Button
                  onClick={() => {
                    setComparison(null)
                    setChanges([])
                    setExistingResume("")
                  }}
                  variant="outline"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Start New Comparison
                </Button>
                <Button onClick={exportAcceptedChanges} disabled={stats.accepted === 0}>
                  <FileDown className="mr-2 h-4 w-4" />
                  Export {stats.accepted} Accepted Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
