"use client"

import { Card, CardContent } from "@/components/ui/card"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { Pagination } from "@/components/ui/pagination"
import { useAchievementsQuery, useAchievementStatsQuery, useResumesQuery } from "@/lib/api/queries"
import { PAGINATION } from "@/lib/constants"
import type { AchievementType } from "@/lib/db/types"
import type { ResumeWithSections } from "@/lib/services/resume/resume.types"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { AchievementReviewModal } from "./components/achievement-review-modal"
import { AchievementsFilters } from "./components/achievements-filters"
import { AchievementsHeader } from "./components/achievements-header"
import { AchievementsList } from "./components/achievements-list"
import { AchievementsSelectionControls } from "./components/achievements-selection-controls"
import { AchievementsStats } from "./components/achievements-stats"
import { BulkEditPanel } from "./components/bulk-edit-panel"
import { PendingAchievementsAlert } from "./components/pending-achievements-alert"
import type { ReviewStatusFilter, SortOrder } from "./components/types"
import {
  exportAchievementsToMarkdown,
  filterAchievements,
  sortAchievements,
} from "./components/utils"

export function AchievementsPage() {
  const { data: stats } = useAchievementStatsQuery()
  const { data: resumesData } = useResumesQuery()

  const [typeFilter, setTypeFilter] = useState<AchievementType | "all">("all")
  const [reviewStatusFilter, setReviewStatusFilter] = useState<ReviewStatusFilter>("all")
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedAchievements, setSelectedAchievements] = useState<Set<string>>(new Set())
  const [selectedAchievementForReview, setSelectedAchievementForReview] = useState<string | null>(
    null
  )
  const [showBulkEdit, setShowBulkEdit] = useState(false)
  const [currentPage, setCurrentPage] = useState<number>(PAGINATION.DEFAULT_PAGE)
  const pageSize = PAGINATION.DEFAULT_PAGE_SIZE

  // Bulk edit state
  const [bulkRelevance, setBulkRelevance] = useState<number | undefined>()
  const [bulkResumeSectionId, setBulkResumeSectionId] = useState<string | null>(null)
  const [bulkTechTags, setBulkTechTags] = useState<string[]>([])
  const [bulkTechTagInput, setBulkTechTagInput] = useState("")
  const [isBulkUpdating, setIsBulkUpdating] = useState(false)
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)

  // Map reviewStatus filter to query parameter - exclude archived by default when "all" is selected
  const reviewStatusMap: Record<
    ReviewStatusFilter,
    "pending" | "reviewed" | "archived" | undefined
  > = {
    all: undefined, // Exclude archived by default
    pending: "pending",
    reviewed: "reviewed",
    archived: "archived",
  }

  const {
    data: achievementsData,
    isLoading,
    refetch,
  } = useAchievementsQuery({
    reviewStatus: reviewStatusMap[reviewStatusFilter],
    type: typeFilter === "all" ? undefined : typeFilter,
    page: currentPage,
    pageSize,
    enabled: true,
  })

  const achievements = achievementsData?.achievements || []
  const totalAchievements = achievementsData?.total || 0
  const totalPages = Math.ceil(totalAchievements / pageSize)
  const resumes = (resumesData?.resumes || []) as unknown as ResumeWithSections[]
  const allSections: Array<{ id: string; label: string }> = resumes.flatMap((resume) =>
    resume.sections.map((section) => ({
      id: section.id,
      label: `${section.position} at ${section.company} (${section.startDate} - ${section.endDate || "Present"})`,
    }))
  )

  // Filter and sort brags (client-side for current page only)
  const filteredAchievements = filterAchievements(achievementsData?.achievements || [], searchQuery)
  const sortedAchievements = sortAchievements(filteredAchievements, sortOrder)

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(PAGINATION.DEFAULT_PAGE)
  }, [reviewStatusFilter, typeFilter, searchQuery])

  // Close modal if selected achievement is no longer in the list (e.g., after refetch or filter change)
  useEffect(() => {
    if (
      selectedAchievementForReview &&
      !sortedAchievements.find((a) => a.id === selectedAchievementForReview)
    ) {
      setSelectedAchievementForReview(null)
    }
  }, [selectedAchievementForReview, sortedAchievements])

  const toggleSelectAchievement = (achievementId: string) => {
    const newSelected = new Set(selectedAchievements)
    if (newSelected.has(achievementId)) {
      newSelected.delete(achievementId)
    } else {
      newSelected.add(achievementId)
    }
    setSelectedAchievements(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedAchievements.size === sortedAchievements.length) {
      setSelectedAchievements(new Set())
    } else {
      setSelectedAchievements(new Set(sortedAchievements.map((a) => a.id)))
    }
  }

  const handleBulkUpdate = async () => {
    if (selectedAchievements.size === 0) return

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

      const response = await fetch("/api/achievements/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          achievementIds: Array.from(selectedAchievements),
          ...updateData,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update achievements")
      }

      // Reset bulk edit state
      setSelectedAchievements(new Set())
      setShowBulkEdit(false)
      setBulkRelevance(undefined)
      setBulkResumeSectionId(null)
      setBulkTechTags([])
      refetch()
    } catch (error) {
      console.error("Bulk update error:", error)
      alert("Failed to update brags. Please try again.")
    } finally {
      setIsBulkUpdating(false)
    }
  }

  const performBulkArchive = async () => {
    if (selectedAchievements.size === 0) return

    setIsBulkUpdating(true)
    try {
      const response = await fetch("/api/brags/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          achievementIds: Array.from(selectedAchievements),
          reviewStatus: "archived",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to archive brags")
      }

      setSelectedAchievements(new Set())
      setShowBulkEdit(false)
      refetch()
    } catch (error) {
      console.error("Bulk archive error:", error)
      alert("Failed to archive brags. Please try again.")
    } finally {
      setIsBulkUpdating(false)
    }
  }

  const handleBulkArchive = () => {
    if (selectedAchievements.size === 0) return
    setShowArchiveConfirm(true)
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
    exportAchievementsToMarkdown(sortedAchievements)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Achievements</h1>
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
      <AchievementsHeader onExport={exportToMarkdown} />

      {stats && (
        <PendingAchievementsAlert
          pendingCount={stats.pending}
          onReviewClick={() => {
            // Find first pending achievement from current list (no filter change, no refetch)
            const firstPendingAchievement = achievements.find(
              (achievement) => achievement.reviewStatus === "pending"
            )
            if (firstPendingAchievement) {
              setSelectedAchievementForReview(firstPendingAchievement.id)
            }
          }}
        />
      )}

      {stats && <AchievementsStats stats={stats} selectedCount={selectedAchievements.size} />}

      <ConfirmationDialog
        open={showArchiveConfirm}
        onOpenChange={setShowArchiveConfirm}
        title="Archive Achievements"
        description={`Are you sure you want to archive ${selectedAchievements.size} achievement(s)?`}
        confirmText="Archive"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={performBulkArchive}
      />

      {showBulkEdit && selectedAchievements.size > 0 && (
        <BulkEditPanel
          selectedCount={selectedAchievements.size}
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
            setSelectedAchievements(new Set())
            setShowBulkEdit(false)
          }}
          onClose={() => setShowBulkEdit(false)}
        />
      )}

      <AchievementsFilters
        searchQuery={searchQuery}
        reviewStatusFilter={reviewStatusFilter}
        typeFilter={typeFilter}
        sortOrder={sortOrder}
        onSearchChange={setSearchQuery}
        onReviewStatusChange={setReviewStatusFilter}
        onTypeChange={setTypeFilter}
        onSortChange={setSortOrder}
      />

      <AchievementsSelectionControls
        totalCount={sortedAchievements.length}
        selectedCount={selectedAchievements.size}
        onSelectAll={toggleSelectAll}
        onEditSelected={() => setShowBulkEdit(true)}
        onClearSelection={() => setSelectedAchievements(new Set())}
      />

      {totalAchievements > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            Showing{" "}
            <span className="font-medium text-foreground">{(currentPage - 1) * pageSize + 1}</span>{" "}
            to{" "}
            <span className="font-medium text-foreground">
              {Math.min(currentPage * pageSize, totalAchievements)}
            </span>{" "}
            of <span className="font-medium text-foreground">{totalAchievements}</span> results
            {totalPages > 1 && (
              <span className="ml-2">
                (Page <span className="font-medium text-foreground">{currentPage}</span> of{" "}
                <span className="font-medium text-foreground">{totalPages}</span>)
              </span>
            )}
          </div>
        </div>
      )}

      <AchievementsList
        achievements={sortedAchievements}
        selectedAchievements={selectedAchievements}
        onSelectAchievement={toggleSelectAchievement}
        onReviewAchievement={(achievementId) => setSelectedAchievementForReview(achievementId)}
      />

      {totalAchievements > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          total={totalAchievements}
          onPageChange={setCurrentPage}
        />
      )}

      {selectedAchievementForReview &&
        (() => {
          const currentAchievement = sortedAchievements.find(
            (a) => a.id === selectedAchievementForReview
          )

          // Don't render modal if achievement is not found (useEffect will close it)
          if (!currentAchievement) {
            return null
          }

          const currentIndex = sortedAchievements.findIndex(
            (a) => a.id === selectedAchievementForReview
          )
          const isPending = currentAchievement.reviewStatus === "pending"

          return (
            <AchievementReviewModal
              achievement={currentAchievement}
              allAchievements={sortedAchievements}
              currentIndex={currentIndex}
              onClose={() => setSelectedAchievementForReview(null)}
              onSave={() => {
                refetch()
              }}
              onNavigate={(achievementId) => {
                // Verify achievement exists before navigating
                const targetAchievement = sortedAchievements.find((a) => a.id === achievementId)
                if (targetAchievement) {
                  setSelectedAchievementForReview(achievementId)
                } else {
                  // If achievement not found, close modal
                  setSelectedAchievementForReview(null)
                }
              }}
              autoNavigateToNextPending={isPending}
            />
          )
        })()}
    </div>
  )
}
