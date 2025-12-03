"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { GitHubContributionData } from "@/lib/db/types"

// TODO: Use lucide icons
// TODO: Extract page logic to a separate file
// TODO: Use react query for the API calls / State management

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

export default function ResumeComparePage() {
  const [loading, setLoading] = useState(false)
  const [comparison, setComparison] = useState<ComparisonData | null>(null)
  const [changes, setChanges] = useState<SectionChange[]>([])
  const [existingResume, setExistingResume] = useState("")
  const [contributions, setContributions] = useState<GitHubContributionData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadContributions()
  }, [])

  const loadContributions = async () => {
    try {
      const response = await fetch("/api/github/scan")
      if (response.ok) {
        const data = await response.json()
        setContributions(data.data)
      }
    } catch (err) {
      console.error("Failed to load contributions:", err)
    }
  }

  const handleCompare = async () => {
    if (!existingResume.trim() || !contributions) {
      setError("Please provide resume text and scan your GitHub contributions")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/llm/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          existingResume,
          contributions,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to compare resume")
      }

      const result = await response.json()
      setComparison(result.data)

      // Convert comparison data to changes
      const newChanges: SectionChange[] = [
        ...result.data.missingAchievements.map((achievement: string, index: number) => ({
          id: `missing-${index}`,
          type: "missing" as const,
          content: achievement,
          accepted: null,
        })),
        ...result.data.outdatedSections.map((section: string, index: number) => ({
          id: `outdated-${index}`,
          type: "outdated" as const,
          content: section,
          accepted: null,
        })),
        ...result.data.suggestions.map((suggestion: string, index: number) => ({
          id: `suggestion-${index}`,
          type: "suggestion" as const,
          content: suggestion,
          accepted: null,
        })),
      ]
      setChanges(newChanges)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to compare resume")
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = (id: string) => {
    setChanges((prev) =>
      prev.map((change) =>
        change.id === id ? { ...change, accepted: true } : change
      )
    )
  }

  const handleReject = (id: string) => {
    setChanges((prev) =>
      prev.map((change) =>
        change.id === id ? { ...change, accepted: false } : change
      )
    )
  }

  const exportAcceptedChanges = () => {
    const accepted = changes.filter((c) => c.accepted === true)
    
    let markdown = "# Resume Update Recommendations\n\n"
    markdown += `Generated on ${new Date().toLocaleDateString()}\n\n`
    
    const byType = accepted.reduce((acc, change) => {
      if (!acc[change.type]) acc[change.type] = []
      acc[change.type].push(change.content)
      return acc
    }, {} as Record<string, string[]>)

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

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Resume Comparison</h1>
          <p className="text-muted-foreground">
            AI-powered analysis of your resume vs GitHub activity
          </p>
        </div>
        {comparison && (
          <Button onClick={exportAcceptedChanges} disabled={stats.accepted === 0}>
            Export Accepted ({stats.accepted})
          </Button>
        )}
      </div>

      {/* Resume Input */}
      {!comparison && (
        <Card>
          <CardHeader>
            <CardTitle>Paste Your Current Resume</CardTitle>
            <CardDescription>
              Paste your resume text below to compare with GitHub contributions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea
              value={existingResume}
              onChange={(e) => setExistingResume(e.target.value)}
              placeholder="Paste your resume content here..."
              rows={15}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
            />
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button
              onClick={handleCompare}
              disabled={loading || !existingResume.trim() || !contributions}
              className="w-full"
            >
              {loading ? "Analyzing..." : "Compare with GitHub"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Comparison Results */}
      {comparison && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Changes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-green-600">
                  Accepted
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats.accepted}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-red-600">
                  Rejected
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {stats.rejected}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-yellow-600">
                  Pending
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {stats.pending}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Split View */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Original Resume */}
            <Card>
              <CardHeader>
                <CardTitle>Current Resume</CardTitle>
                <CardDescription>Your existing resume content</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm p-4 bg-muted rounded-lg max-h-[600px] overflow-y-auto">
                  {existingResume}
                </div>
              </CardContent>
            </Card>

            {/* Right: Suggested Changes */}
            <Card>
              <CardHeader>
                <CardTitle>Suggested Changes</CardTitle>
                <CardDescription>
                  Based on your GitHub contributions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {changes.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No changes suggested
                  </p>
                ) : (
                  changes.map((change) => (
                    <div
                      key={change.id}
                      className={`p-4 border rounded-lg space-y-3 ${
                        change.accepted === true
                          ? "bg-green-50 border-green-200"
                          : change.accepted === false
                          ? "bg-red-50 border-red-200"
                          : "bg-background"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <Badge
                          variant={
                            change.type === "missing"
                              ? "default"
                              : change.type === "outdated"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {change.type === "missing"
                            ? "Missing"
                            : change.type === "outdated"
                            ? "Outdated"
                            : "Suggestion"}
                        </Badge>
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
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleReject(change.id)}
                            variant="outline"
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={() => {
                    setComparison(null)
                    setChanges([])
                    setExistingResume("")
                  }}
                  variant="outline"
                >
                  Start New Comparison
                </Button>
                <Button onClick={exportAcceptedChanges} disabled={stats.accepted === 0}>
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

