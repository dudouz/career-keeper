"use client"

import { Card, CardContent } from "@/components/ui/card"
import { useBragsQuery, useBragStatsQuery, useResumesQuery } from "@/lib/api/queries"
import type { BragType } from "@/lib/db/types"
import type { ResumeWithSections } from "@/lib/services/resume/resume.types"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { BragReviewModal } from "../brags/brag-review-modal"
import { BragFilters } from "./components/brag-filters"
import { BragHeader } from "./components/brag-header"
import { BragList } from "./components/brag-list"
import { BragSelectionControls } from "./components/brag-selection-controls"
import { BragStats } from "./components/brag-stats"
import { BulkEditPanel } from "./components/bulk-edit-panel"
import { PendingBragsAlert } from "./components/pending-brags-alert"
import type { ReviewStatusFilter, SortOrder } from "./components/types"
import { exportBragsToMarkdown, filterBrags, sortBrags } from "./components/utils"

export function BragListPage() {
  const { data: stats } = useBragStatsQuery()
  const { data: resumesData } = useResumesQuery()

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
    // Exclude archived by default, only show if explicitly selected
    reviewStatus:
      reviewStatusFilter === "all"
        ? undefined // When "all", exclude archived by default
        : reviewStatusFilter === "archived"
          ? "archived"
          : reviewStatusFilter,
    type: typeFilter === "all" ? undefined : typeFilter,
    enabled: true,
  })

  const brags = bragsData?.brags || []
  const resumes = (resumesData?.resumes || []) as unknown as ResumeWithSections[]
  const allSections: Array<{ id: string; label: string }> = resumes.flatMap((resume) =>
    resume.sections.map((section) => ({
      id: section.id,
      label: `${section.position} at ${section.company} (${section.startDate} - ${section.endDate || "Present"})`,
    }))
  )

  // Filter and sort brags
  const filteredBrags = filterBrags(brags, searchQuery)
  const sortedBrags = sortBrags(filteredBrags, sortOrder)

  // Close modal if selected brag is no longer in the list (e.g., after refetch or filter change)
  useEffect(() => {
    if (selectedBragForReview && !sortedBrags.find((b) => b.id === selectedBragForReview)) {
      setSelectedBragForReview(null)
    }
  }, [selectedBragForReview, sortedBrags])

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

  const handleAddBulkTechTag = (tag: string) => {
    if (tag.trim() && !bulkTechTags.includes(tag.trim())) {
      setBulkTechTags([...bulkTechTags, tag.trim()])
      setBulkTechTagInput("")
    }
  }

  const handleRemoveBulkTechTag = (tag: string) => {
    setBulkTechTags(bulkTechTags.filter((t) => t !== tag))
  }

  const exportToMarkdown = () => {
    exportBragsToMarkdown(sortedBrags)
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
      <BragHeader onExport={exportToMarkdown} />

      {stats && (
        <PendingBragsAlert
          pendingCount={stats.pending}
          onReviewClick={() => setReviewStatusFilter("pending")}
        />
      )}

      {stats && <BragStats stats={stats} selectedCount={selectedBrags.size} />}

      {showBulkEdit && selectedBrags.size > 0 && (
        <BulkEditPanel
          selectedCount={selectedBrags.size}
          relevance={bulkRelevance}
          resumeSectionId={bulkResumeSectionId}
          techTags={bulkTechTags}
          techTagInput={bulkTechTagInput}
          isUpdating={isBulkUpdating}
          resumeSections={allSections}
          onRelevanceChange={setBulkRelevance}
          onResumeSectionChange={setBulkResumeSectionId}
          onTechTagAdd={handleAddBulkTechTag}
          onTechTagRemove={handleRemoveBulkTechTag}
          onTechTagInputChange={setBulkTechTagInput}
          onUpdate={handleBulkUpdate}
          onArchive={handleBulkArchive}
          onCancel={() => {
            setSelectedBrags(new Set())
            setShowBulkEdit(false)
          }}
          onClose={() => setShowBulkEdit(false)}
        />
      )}

      <BragFilters
        searchQuery={searchQuery}
        reviewStatusFilter={reviewStatusFilter}
        typeFilter={typeFilter}
        sortOrder={sortOrder}
        onSearchChange={setSearchQuery}
        onReviewStatusChange={setReviewStatusFilter}
        onTypeChange={setTypeFilter}
        onSortChange={setSortOrder}
      />

      <BragSelectionControls
        totalCount={sortedBrags.length}
        selectedCount={selectedBrags.size}
        onSelectAll={toggleSelectAll}
        onEditSelected={() => setShowBulkEdit(true)}
        onClearSelection={() => setSelectedBrags(new Set())}
      />

      <BragList
        brags={sortedBrags}
        selectedBrags={selectedBrags}
        onSelectBrag={toggleSelectBrag}
        onReviewBrag={(bragId) => setSelectedBragForReview(bragId)}
      />

      {selectedBragForReview &&
        (() => {
          const currentBrag = sortedBrags.find((b) => b.id === selectedBragForReview)

          // Don't render modal if brag is not found (useEffect will close it)
          if (!currentBrag) {
            return null
          }

          const currentIndex = sortedBrags.findIndex((b) => b.id === selectedBragForReview)
          const isPending = currentBrag.reviewStatus === "pending"

          return (
            <BragReviewModal
              brag={{
                id: currentBrag.id,
                type: currentBrag.type,
                title: currentBrag.title,
                description: currentBrag.description,
                date:
                  typeof currentBrag.date === "string"
                    ? new Date(currentBrag.date)
                    : currentBrag.date,
                repository: currentBrag.repository,
                url: currentBrag.url,
                relevance: currentBrag.relevance,
                resumeSectionId: currentBrag.resumeSectionId,
                techTags: currentBrag.techTags,
                customDescription: currentBrag.customDescription,
                reviewStatus: currentBrag.reviewStatus,
              }}
              allBrags={sortedBrags}
              currentIndex={currentIndex}
              onClose={() => setSelectedBragForReview(null)}
              onSave={() => {
                refetch()
              }}
              onNavigate={(bragId) => {
                // Verify brag exists before navigating
                const targetBrag = sortedBrags.find((b) => b.id === bragId)
                if (targetBrag) {
                  setSelectedBragForReview(bragId)
                } else {
                  // If brag not found, close modal
                  setSelectedBragForReview(null)
                }
              }}
              autoNavigateToNextPending={isPending}
            />
          )
        })()}
    </div>
  )
}
