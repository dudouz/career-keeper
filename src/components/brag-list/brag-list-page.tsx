"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useGitHubContributionsQuery, useGitHubStatusQuery } from "@/lib/api/queries"
import {
  AlertCircle,
  Code2,
  ExternalLink,
  FileDown,
  FileText,
  GitCommit,
  GitPullRequest,
  Loader2,
  Rocket,
  Search,
  Sparkles,
} from "lucide-react"
import { useState } from "react"

type ContributionType = "all" | "commit" | "pr" | "issue" | "release"
type SortOrder = "newest" | "oldest" | "most-impact"

export function BragListPage() {
  const { data: statusData } = useGitHubStatusQuery()
  const isConnected = statusData?.connected || false
  const { data, isLoading } = useGitHubContributionsQuery({
    enabled: isConnected, // Only fetch when GitHub is connected
  })
  const contributions = data?.contributions

  const [filter, setFilter] = useState<ContributionType>("all")
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest")
  const [searchQuery, setSearchQuery] = useState("")

  const filterContributions = () => {
    if (!contributions) return []

    let items: Array<{
      type: string
      title: string
      date: string
      repository: string
      url: string
      significance?: "high" | "medium" | "low"
      description?: string
    }> = []

    // Collect all contributions
    if (filter === "all" || filter === "commit") {
      items.push(
        ...contributions.commits.map((c) => ({
          type: "commit",
          title: c.message,
          date: c.date,
          repository: c.repository,
          url: c.url,
          significance:
            c.message.toLowerCase().includes("feat") || c.message.toLowerCase().includes("feature")
              ? ("high" as const)
              : ("low" as const),
        }))
      )
    }

    if (filter === "all" || filter === "pr") {
      items.push(
        ...contributions.pullRequests.map((pr) => ({
          type: "pr",
          title: pr.title,
          date: pr.createdAt,
          repository: pr.repository,
          url: pr.url,
          significance: pr.state === "closed" ? ("high" as const) : ("medium" as const),
        }))
      )
    }

    if (filter === "all" || filter === "issue") {
      items.push(
        ...contributions.issues.map((issue) => ({
          type: "issue",
          title: issue.title,
          date: issue.createdAt,
          repository: issue.repository,
          url: issue.url,
          significance: issue.state === "closed" ? ("high" as const) : ("medium" as const),
        }))
      )
    }

    if (filter === "all" || filter === "release") {
      items.push(
        ...contributions.releases.map((release) => ({
          type: "release",
          title: release.name,
          date: release.createdAt,
          repository: release.repository,
          url: release.url,
          significance: "high" as const,
          description: release.body,
        }))
      )
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.repository.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query)
      )
    }

    // Sort
    items.sort((a, b) => {
      if (sortOrder === "newest") {
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      }
      if (sortOrder === "oldest") {
        return new Date(a.date).getTime() - new Date(b.date).getTime()
      }
      // most-impact: releases > high > medium > low
      const scoreMap = {
        high: 3,
        medium: 2,
        low: 1,
      }
      const scoreA = a.type === "release" ? 4 : scoreMap[a.significance || "low"]
      const scoreB = b.type === "release" ? 4 : scoreMap[b.significance || "low"]
      return scoreB - scoreA
    })

    return items
  }

  const exportToMarkdown = () => {
    const items = filterContributions()
    let markdown = "# My Brag List\n\n"
    markdown += `Generated on ${new Date().toLocaleDateString()}\n\n`

    const groupedByType = items.reduce(
      (acc, item) => {
        if (!acc[item.type]) acc[item.type] = []
        acc[item.type].push(item)
        return acc
      },
      {} as Record<string, typeof items>
    )

    Object.entries(groupedByType).forEach(([type, typeItems]) => {
      markdown += `## ${type.toUpperCase()}S\n\n`
      typeItems.forEach((item) => {
        markdown += `- **${item.title}** - ${item.repository}\n`
        markdown += `  - Date: ${new Date(item.date).toLocaleDateString()}\n`
        markdown += `  - [View on GitHub](${item.url})\n`
        if (item.description) {
          markdown += `  - ${item.description.slice(0, 200)}...\n`
        }
        markdown += "\n"
      })
    })

    // Download
    const blob = new Blob([markdown], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `brag-list-${new Date().toISOString().split("T")[0]}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Brag List</h1>
          <p className="text-muted-foreground">Your resume-worthy achievements from GitHub</p>
        </div>
        <Card>
          <CardContent className="py-8 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
            <p className="mt-2 text-muted-foreground">Loading your contributions...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!contributions) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Brag List</h1>
          <p className="text-muted-foreground">Your resume-worthy achievements from GitHub</p>
        </div>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <CardTitle>No Contributions Found</CardTitle>
            </div>
            <CardDescription>Scan your GitHub to generate your brag list</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => (window.location.href = "/dashboard/github")}>
              Connect GitHub
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const filteredItems = filterContributions()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Brag List</h1>
          <p className="text-muted-foreground">Your resume-worthy achievements from GitHub</p>
        </div>
        <Button onClick={exportToMarkdown}>
          <FileDown className="mr-2 h-4 w-4" />
          Export to Markdown
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Sparkles className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredItems.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Commits</CardTitle>
              <GitCommit className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contributions.commits.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Pull Requests</CardTitle>
              <GitPullRequest className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contributions.pullRequests.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Issues</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contributions.issues.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Releases</CardTitle>
              <Rocket className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contributions.releases.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search contributions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Type Filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as ContributionType)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">All Types</option>
              <option value="commit">Commits</option>
              <option value="pr">Pull Requests</option>
              <option value="issue">Issues</option>
              <option value="release">Releases</option>
            </select>

            {/* Sort Order */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrder)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="most-impact">Most Impact</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Contributions List */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <AlertCircle className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground">No contributions found matching your filters.</p>
            </CardContent>
          </Card>
        ) : (
          filteredItems.map((item, index) => (
            <Card key={index} className="transition-shadow hover:shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      {item.type === "commit" && (
                        <GitCommit className="h-4 w-4 text-muted-foreground" />
                      )}
                      {item.type === "pr" && (
                        <GitPullRequest className="h-4 w-4 text-muted-foreground" />
                      )}
                      {item.type === "issue" && (
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      )}
                      {item.type === "release" && (
                        <Rocket className="h-4 w-4 text-muted-foreground" />
                      )}
                      <Badge
                        variant={
                          item.type === "release"
                            ? "default"
                            : item.significance === "high"
                              ? "default"
                              : "secondary"
                        }
                      >
                        {item.type.toUpperCase()}
                      </Badge>
                      {item.significance === "high" && item.type !== "release" && (
                        <Badge variant="outline">High Impact</Badge>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{item.repository}</span>
                      <span>•</span>
                      <span>{new Date(item.date).toLocaleDateString()}</span>
                    </div>
                    {item.description && (
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(item.url, "_blank")}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Languages Overview */}
      {contributions.languages && Object.keys(contributions.languages).length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Code2 className="h-5 w-5" />
              <CardTitle>Languages Used</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(contributions.languages)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10)
                .map(([lang, count]) => (
                  <Badge key={lang} variant="secondary">
                    {lang}: {count}
                  </Badge>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
