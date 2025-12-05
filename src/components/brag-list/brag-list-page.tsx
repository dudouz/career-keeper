"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  useBragsQuery,
  useBragStatsQuery,
  useGitHubStatusQuery,
  useResumesQuery,
} from "@/lib/api/queries"
import type { BragType } from "@/lib/db/types"
import {
  AlertCircle,
  Check,
  ExternalLink,
  FileDown,
  FileText,
  GitCommit,
  GitPullRequest,
  Loader2,
  Rocket,
  Search,
  Sparkles,
  X,
} from "lucide-react"
import { useState } from "react"
import { BragReviewModal } from "../brags/brag-review-modal"

type ContributionType = "all" | "commit" | "pr" | "issue" | "release"
type SortOrder = "newest" | "oldest" | "most-impact"
type ReviewStatusFilter = "all" | "pending" | "reviewed"

export function BragListPage() {
  const { data: statusData } = useGitHubStatusQuery()
  const isConnected = statusData?.connected || false
  const { data: stats } = useBragStatsQuery()
  const { data: resumesData } = useResumesQuery()

  const [filter, setFilter] = useState<ContributionType>("all")
  const [typeFilter, setTypeFilter] = useState<BragType | "all">("all")
  const [reviewStatusFilter, setReviewStatusFilter] = useState<ReviewStatusFilter>("all")
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedBrags, setSelectedBrags] = useState<Set<string>>(new Set())
  const [selectedBragForReview, setSelectedBragForReview] = useState<string | null>(null)
  const [showBulkEdit, setShowBulkEdit] = useState(false)

  // Bulk edit state
  const [bulkRelevance, setBulkRelevance] = useState<number | undefined>()
  const [bulkResumeSectionId, setBulkResumeSectionId] = useState<string | null>(null)
  const [bulkTechTags, setBulkTechTags] = useState<string[]>([])
  const [bulkTechTagInput, setBulkTechTagInput] = useState("")
  const [isBulkUpdating, setIsBulkUpdating] = useState(false)

  const {
    data: bragsData,
    isLoading,
    refetch,
  } = useBragsQuery({
    reviewStatus: reviewStatusFilter === "all" ? undefined : reviewStatusFilter,
    type: typeFilter === "all" ? undefined : typeFilter,
    enabled: true,
  })

  const brags = bragsData?.brags || []
  const resumes = resumesData?.resumes || []
  const allSections = resumes.flatMap((resume) =>
    resume.sections.map((section) => ({
      id: section.id,
      label: `${section.position} at ${section.company} (${section.startDate} - ${section.endDate || "Present"})`,
    }))
  )

  // Filter and sort brags
  const filteredBrags = brags.filter((brag) => {
    // Type filter
    if (filter !== "all" && brag.type !== filter) return false

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      if (
        !brag.title.toLowerCase().includes(query) &&
        !brag.repository.toLowerCase().includes(query) &&
        !brag.description?.toLowerCase().includes(query) &&
        !brag.customDescription?.toLowerCase().includes(query)
      ) {
        return false
      }
    }

    return true
  })

  // Sort brags
  const sortedBrags = [...filteredBrags].sort((a, b) => {
    if (sortOrder === "newest") {
      const dateA = typeof a.date === "string" ? new Date(a.date) : a.date
      const dateB = typeof b.date === "string" ? new Date(b.date) : b.date
      return dateB.getTime() - dateA.getTime()
    }
    if (sortOrder === "oldest") {
      const dateA = typeof a.date === "string" ? new Date(a.date) : a.date
      const dateB = typeof b.date === "string" ? new Date(b.date) : b.date
      return dateA.getTime() - dateB.getTime()
    }
    // most-impact: by relevance (higher first)
    const relevanceA = a.relevance || 0
    const relevanceB = b.relevance || 0
    return relevanceB - relevanceA
  })

  const toggleSelectBrag = (bragId: string) => {
    const newSelected = new Set(selectedBrags)
    if (newSelected.has(bragId)) {
      newSelected.delete(bragId)
    } else {
      newSelected.add(bragId)
    }
    setSelectedBrags(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedBrags.size === sortedBrags.length) {
      setSelectedBrags(new Set())
    } else {
      setSelectedBrags(new Set(sortedBrags.map((b) => b.id)))
    }
  }

  const handleBulkUpdate = async () => {
    if (selectedBrags.size === 0) return

    setIsBulkUpdating(true)
    try {
      const updateData: {
        relevance?: number
        resumeSectionId?: string | null
        techTags?: string[]
      } = {}

      if (bulkRelevance !== undefined) {
        updateData.relevance = bulkRelevance
      }
      if (bulkResumeSectionId !== undefined) {
        updateData.resumeSectionId = bulkResumeSectionId
      }
      if (bulkTechTags.length > 0) {
        updateData.techTags = bulkTechTags
      }

      const response = await fetch("/api/brags/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bragIds: Array.from(selectedBrags),
          ...updateData,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update brags")
      }

      // Reset bulk edit state
      setSelectedBrags(new Set())
      setShowBulkEdit(false)
      setBulkRelevance(undefined)
      setBulkResumeSectionId(null)
      setBulkTechTags([])
      refetch()
    } catch (error) {
      console.error("Bulk update error:", error)
      alert("Erro ao atualizar brags. Tente novamente.")
    } finally {
      setIsBulkUpdating(false)
    }
  }

  const handleBulkArchive = async () => {
    if (selectedBrags.size === 0) return

    if (!confirm(`Arquivar ${selectedBrags.size} brag(s)?`)) return

    setIsBulkUpdating(true)
    try {
      const response = await fetch("/api/brags/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bragIds: Array.from(selectedBrags),
          reviewStatus: "archived",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to archive brags")
      }

      setSelectedBrags(new Set())
      setShowBulkEdit(false)
      refetch()
    } catch (error) {
      console.error("Bulk archive error:", error)
      alert("Erro ao arquivar brags. Tente novamente.")
    } finally {
      setIsBulkUpdating(false)
    }
  }

  const handleAddBulkTechTag = () => {
    if (bulkTechTagInput.trim() && !bulkTechTags.includes(bulkTechTagInput.trim())) {
      setBulkTechTags([...bulkTechTags, bulkTechTagInput.trim()])
      setBulkTechTagInput("")
    }
  }

  const handleRemoveBulkTechTag = (tag: string) => {
    setBulkTechTags(bulkTechTags.filter((t) => t !== tag))
  }

  const exportToMarkdown = () => {
    let markdown = "# My Brag List\n\n"
    markdown += `Generated on ${new Date().toLocaleDateString()}\n\n`

    const reviewedBrags = sortedBrags.filter((b) => b.reviewStatus === "reviewed")

    reviewedBrags.forEach((brag) => {
      const bragDate = typeof brag.date === "string" ? new Date(brag.date) : brag.date
      markdown += `## ${brag.title}\n\n`
      markdown += `- **Type:** ${brag.type.toUpperCase()}\n`
      markdown += `- **Repository:** ${brag.repository}\n`
      markdown += `- **Date:** ${bragDate.toLocaleDateString()}\n`
      if (brag.relevance) {
        markdown += `- **Relevance:** ${brag.relevance}/5\n`
      }
      if (brag.techTags && brag.techTags.length > 0) {
        markdown += `- **Technologies:** ${brag.techTags.join(", ")}\n`
      }
      if (brag.customDescription) {
        markdown += `- **Description:** ${brag.customDescription}\n`
      }
      markdown += `- [View on GitHub](${brag.url})\n\n`
    })

    const blob = new Blob([markdown], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `brag-list-${new Date().toISOString().split("T")[0]}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getTypeIcon = (type: BragType) => {
    switch (type) {
      case "commit":
        return <GitCommit className="h-4 w-4" />
      case "pr":
        return <GitPullRequest className="h-4 w-4" />
      case "issue":
        return <FileText className="h-4 w-4" />
      case "release":
        return <Rocket className="h-4 w-4" />
    }
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
            <p className="mt-2 text-muted-foreground">Loading your brags...</p>
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
          <h1 className="text-3xl font-bold">Brag List</h1>
          <p className="text-muted-foreground">Your resume-worthy achievements from GitHub</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToMarkdown}>
            <FileDown className="mr-2 h-4 w-4" />
            Export to Markdown
          </Button>
        </div>
      </div>

      {/* Pending Brags Alert */}
      {stats && stats.pending > 0 && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <p className="font-medium">
                  Você tem <strong>{stats.pending}</strong> brag{stats.pending !== 1 ? "s" : ""}{" "}
                  pendente{stats.pending !== 1 ? "s" : ""} para revisar
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setReviewStatusFilter("pending")}
                className="border-yellow-600 text-yellow-700 hover:bg-yellow-100"
              >
                Revisar Agora
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
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
                <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Revisados</CardTitle>
                <Check className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.reviewed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Arquivados</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{stats.archived}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Selecionados</CardTitle>
                <Check className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{selectedBrags.size}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bulk Edit Panel */}
      {showBulkEdit && selectedBrags.size > 0 && (
        <Card className="border-blue-500 bg-blue-50 dark:bg-blue-950">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Edição em Lote ({selectedBrags.size} selecionados)</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowBulkEdit(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Bulk Relevance */}
            <div>
              <label className="mb-2 block text-sm font-medium">Relevância (1-5)</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <Button
                    key={value}
                    type="button"
                    variant={bulkRelevance === value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setBulkRelevance(value)}
                  >
                    {value}
                  </Button>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setBulkRelevance(undefined)}
                >
                  Limpar
                </Button>
              </div>
            </div>

            {/* Bulk Resume Section */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Associar a Experiência do Currículo
              </label>
              <select
                value={bulkResumeSectionId || ""}
                onChange={(e) => setBulkResumeSectionId(e.target.value || null)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Nenhuma (não associar)</option>
                {allSections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Bulk Tech Tags */}
            <div>
              <label className="mb-2 block text-sm font-medium">Tecnologias (Tags)</label>
              <div className="mb-2 flex gap-2">
                <Input
                  value={bulkTechTagInput}
                  onChange={(e) => setBulkTechTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddBulkTechTag()
                    }
                  }}
                  placeholder="Digite uma tecnologia e pressione Enter"
                />
                <Button type="button" onClick={handleAddBulkTechTag}>
                  Adicionar
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {bulkTechTags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveBulkTechTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Bulk Actions */}
            <div className="flex gap-2 border-t pt-2">
              <Button onClick={handleBulkUpdate} disabled={isBulkUpdating}>
                {isBulkUpdating ? "Salvando..." : "Aplicar Alterações"}
              </Button>
              <Button variant="outline" onClick={handleBulkArchive} disabled={isBulkUpdating}>
                Arquivar Selecionados
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setSelectedBrags(new Set())
                  setShowBulkEdit(false)
                }}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search brags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Review Status Filter */}
            <select
              value={reviewStatusFilter}
              onChange={(e) => setReviewStatusFilter(e.target.value as ReviewStatusFilter)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">Todos os Status</option>
              <option value="pending">Pendentes</option>
              <option value="reviewed">Revisados</option>
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as BragType | "all")}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
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
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="most-impact">Most Impact</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Selection Controls */}
      {sortedBrags.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={toggleSelectAll}>
              {selectedBrags.size === sortedBrags.length
                ? "Deselecionar Todos"
                : "Selecionar Todos"}
            </Button>
            {selectedBrags.size > 0 && (
              <>
                <Button variant="outline" size="sm" onClick={() => setShowBulkEdit(true)}>
                  Editar Selecionados ({selectedBrags.size})
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSelectedBrags(new Set())}>
                  Limpar Seleção
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Brags List */}
      <div className="space-y-3">
        {sortedBrags.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <AlertCircle className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground">No brags found matching your filters.</p>
            </CardContent>
          </Card>
        ) : (
          sortedBrags.map((brag) => (
            <Card
              key={brag.id}
              className={`transition-shadow hover:shadow-md ${
                selectedBrags.has(brag.id) ? "ring-2 ring-blue-500" : ""
              }`}
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedBrags.has(brag.id)}
                    onChange={() => toggleSelectBrag(brag.id)}
                    className="mt-1 h-4 w-4 rounded border-gray-300"
                  />

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(brag.type)}
                      <Badge variant={brag.reviewStatus === "reviewed" ? "default" : "secondary"}>
                        {brag.type.toUpperCase()}
                      </Badge>
                      {brag.reviewStatus === "pending" && (
                        <Badge variant="outline" className="text-yellow-600">
                          Pendente
                        </Badge>
                      )}
                      {brag.relevance && (
                        <Badge variant="outline">Relevância: {brag.relevance}/5</Badge>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold">{brag.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{brag.repository}</span>
                      <span>•</span>
                      <span>
                        {(typeof brag.date === "string"
                          ? new Date(brag.date)
                          : brag.date
                        ).toLocaleDateString()}
                      </span>
                    </div>
                    {brag.description && (
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {brag.description}
                      </p>
                    )}
                    {brag.customDescription && (
                      <p className="text-sm text-foreground">{brag.customDescription}</p>
                    )}
                    {brag.techTags && brag.techTags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {brag.techTags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(brag.url, "_blank")}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View
                    </Button>
                    {brag.reviewStatus === "pending" && (
                      <Button size="sm" onClick={() => setSelectedBragForReview(brag.id)}>
                        Revisar
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Review Modal */}
      {selectedBragForReview && (
        <BragReviewModal
          brag={brags.find((b) => b.id === selectedBragForReview)!}
          onClose={() => setSelectedBragForReview(null)}
          onSave={() => {
            refetch()
            setSelectedBragForReview(null)
          }}
        />
      )}
    </div>
  )
}
