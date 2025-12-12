"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  useArchiveAchievementMutation,
  useResumesQuery,
  useUnarchiveAchievementMutation,
  useUpdateAchievementReviewMutation,
} from "@/lib/api/queries"
import type { ResumeWithSections } from "@/lib/services/resume/resume.types"
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  GitCommit,
  GitPullRequest,
  Rocket,
  X,
} from "lucide-react"
import { useEffect, useState } from "react"
import type { AchievementListItem } from "./types"

interface AchievementReviewModalProps {
  achievement: AchievementListItem
  allAchievements: AchievementListItem[]
  currentIndex: number
  onClose: () => void
  onSave: () => void
  onNavigate: (bragId: string) => void
  autoNavigateToNextPending?: boolean
}

export function AchievementReviewModal({
  achievement,
  allAchievements,
  currentIndex,
  onClose,
  onSave,
  onNavigate,
  autoNavigateToNextPending = false,
}: AchievementReviewModalProps) {
  const { data: resumesData } = useResumesQuery()
  const updateMutation = useUpdateAchievementReviewMutation()
  const unarchiveMutation = useUnarchiveAchievementMutation()
  const archiveMutation = useArchiveAchievementMutation()
  const [open, setOpen] = useState(true)
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)

  // Normalize date to Date object
  const achievementDate =
    typeof achievement.date === "string" ? new Date(achievement.date) : achievement.date

  // Reset open state when achievement changes (navigation)
  useEffect(() => {
    setOpen(true)
  }, [achievement.id])

  // Handle dialog close
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setOpen(false)
      onClose()
    }
  }

  const [relevance, setRelevance] = useState<number | undefined>(achievement.relevance || undefined)
  const [resumeSectionId, setResumeSectionId] = useState<string | null>(
    achievement.resumeSectionId || null
  )
  const [techTags, setTechTags] = useState<string[]>(achievement.techTags || [])
  const [techTagInput, setTechTagInput] = useState("")
  const [customDescription, setCustomDescription] = useState<string>(
    achievement.customDescription || ""
  )

  // Find previous and next achievements
  const previousAchievement = currentIndex > 0 ? allAchievements[currentIndex - 1] : null
  const nextAchievement =
    currentIndex < allAchievements.length - 1 ? allAchievements[currentIndex + 1] : null

  // Find next pending achievement
  const findNextPendingAchievement = () => {
    const startIndex = currentIndex + 1
    for (let i = startIndex; i < allAchievements.length; i++) {
      if (allAchievements[i].reviewStatus === "pending") {
        return allAchievements[i]
      }
    }
    // If not found after current, search from beginning
    for (let i = 0; i < currentIndex; i++) {
      if (allAchievements[i].reviewStatus === "pending") {
        return allAchievements[i]
      }
    }
    return null
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle keyboard shortcuts when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return
      }

      if (e.key === "ArrowLeft" && previousAchievement) {
        e.preventDefault()
        onNavigate(previousAchievement.id)
      } else if (e.key === "ArrowRight" && nextAchievement) {
        e.preventDefault()
        onNavigate(nextAchievement.id)
      } else if (e.key === "Escape") {
        e.preventDefault()
        onClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [previousAchievement, nextAchievement, onNavigate, onClose])

  // Get all resume sections from all resumes
  const resumes = (resumesData?.resumes || []) as unknown as ResumeWithSections[]
  const allSections = resumes.flatMap((resume) =>
    resume.sections.map((section) => ({
      id: section.id,
      label: `${section.position} at ${section.company} (${section.startDate} - ${section.endDate || "Present"})`,
      resumeId: resume.id,
    }))
  )

  const handleAddTechTag = () => {
    if (techTagInput.trim() && !techTags.includes(techTagInput.trim())) {
      setTechTags([...techTags, techTagInput.trim()])
      setTechTagInput("")
    }
  }

  const handleRemoveTechTag = (tag: string) => {
    setTechTags(techTags.filter((t) => t !== tag))
  }

  const handleSave = async () => {
    await updateMutation.mutateAsync({
      achievementId: achievement.id,
      relevance,
      resumeSectionId,
      techTags,
      customDescription: customDescription || null,
    })
    onSave()

    // Auto-navigate to next pending achievement if enabled
    if (autoNavigateToNextPending) {
      const nextPending = findNextPendingAchievement()
      if (nextPending) {
        onNavigate(nextPending.id)
        return
      }
      // If no next pending achievement found, close modal
      onClose()
      return
    }

    // If no auto-navigate, close modal
    onClose()
  }

  const handleArchive = async () => {
    await archiveMutation.mutateAsync(achievement.id)
    onSave()
    onClose()
  }

  const getTypeIcon = () => {
    switch (achievement.type) {
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

  return (
    <>
      <ConfirmationDialog
        open={showArchiveConfirm}
        onOpenChange={setShowArchiveConfirm}
        title="Archive Achievement"
        description="Are you sure you want to archive this achievement? You can unarchive it later if needed."
        confirmText="Archive"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={handleArchive}
      />

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto p-0">
          <Card className="border-0 shadow-none">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    {getTypeIcon()}
                    <Badge variant="secondary">{achievement.type.toUpperCase()}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {currentIndex + 1} / {allAchievements.length}
                    </span>
                  </div>
                  <CardTitle className="text-xl">{achievement.title}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {achievement.repository} • {achievementDate.toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {/* Navigation buttons */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => previousAchievement && onNavigate(previousAchievement.id)}
                      disabled={!previousAchievement}
                      title="Previous achievement (←)"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => nextAchievement && onNavigate(nextAchievement.id)}
                      disabled={!nextAchievement}
                      title="Next achievement (→)"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Original Description */}
              {achievement.description && (
                <div>
                  <label className="text-sm font-medium">Original Description</label>
                  <p className="mt-1 text-sm text-muted-foreground">{achievement.description}</p>
                </div>
              )}

              {/* Relevance */}
              <div>
                <label className="mb-2 block text-sm font-medium">Relevance (1-5)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <Button
                      key={value}
                      type="button"
                      variant={relevance === value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setRelevance(value)}
                    >
                      {value}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Resume Section */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Associate with Resume Experience
                </label>
                <Select
                  value={resumeSectionId || "none"}
                  onValueChange={(value) => setResumeSectionId(value === "none" ? null : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None (don't associate)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (don't associate)</SelectItem>
                    {allSections.map((section: { id: string; label: string; resumeId: string }) => (
                      <SelectItem key={section.id} value={section.id}>
                        {section.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tech Tags */}
              <div>
                <label className="mb-2 block text-sm font-medium">Technologies (Tags)</label>
                <div className="mb-2 flex gap-2">
                  <Input
                    value={techTagInput}
                    onChange={(e) => setTechTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAddTechTag()
                      }
                    }}
                    placeholder="Type a technology and press Enter"
                  />
                  <Button type="button" onClick={handleAddTechTag}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {techTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTechTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Custom Description */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Custom Description (What was done)
                </label>
                <Textarea
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder="Describe what was done in this achievement..."
                  rows={4}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-between border-t pt-4">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => previousAchievement && onNavigate(previousAchievement.id)}
                    disabled={
                      !previousAchievement ||
                      updateMutation.isPending ||
                      unarchiveMutation.isPending
                    }
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => nextAchievement && onNavigate(nextAchievement.id)}
                    disabled={
                      !nextAchievement || updateMutation.isPending || unarchiveMutation.isPending
                    }
                  >
                    Next
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  {achievement.reviewStatus === "archived" && (
                    <Button
                      variant="outline"
                      onClick={async () => {
                        await unarchiveMutation.mutateAsync(achievement.id)
                        onSave()
                        onClose()
                      }}
                      disabled={
                        unarchiveMutation.isPending ||
                        updateMutation.isPending ||
                        archiveMutation.isPending
                      }
                    >
                      {unarchiveMutation.isPending ? "Unarchiving..." : "Unarchive"}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={onClose}
                    disabled={
                      updateMutation.isPending ||
                      unarchiveMutation.isPending ||
                      archiveMutation.isPending
                    }
                  >
                    Cancel
                  </Button>
                  {achievement.reviewStatus !== "archived" && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => setShowArchiveConfirm(true)}
                        disabled={
                          updateMutation.isPending ||
                          unarchiveMutation.isPending ||
                          archiveMutation.isPending
                        }
                        className="text-destructive hover:text-destructive"
                      >
                        Archive
                      </Button>
                      <Button
                        onClick={handleSave}
                        disabled={
                          updateMutation.isPending ||
                          unarchiveMutation.isPending ||
                          archiveMutation.isPending
                        }
                      >
                        {updateMutation.isPending
                          ? "Saving..."
                          : autoNavigateToNextPending
                            ? "Save & Continue"
                            : "Save"}
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Link to GitHub */}
              <div className="border-t pt-2">
                <Button variant="outline" size="sm" asChild className="w-full">
                  <a href={achievement.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View on GitHub
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    </>
  )
}
