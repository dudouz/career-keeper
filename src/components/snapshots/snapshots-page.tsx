"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { useSnapshotsQuery, useCreateSnapshotMutation, useResumesQuery, useGitHubStatusQuery, useDeactivateSnapshotMutation } from "@/lib/api/queries"
import { Loader2, Plus, Calendar, Briefcase, Code, Sparkles, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"

export function SnapshotsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [snapshotToDelete, setSnapshotToDelete] = useState<string | null>(null)
  const { data: snapshotsData, isLoading, refetch } = useSnapshotsQuery()
  const { data: resumesData } = useResumesQuery()
  const { data: githubStatus } = useGitHubStatusQuery()
  const createSnapshotMutation = useCreateSnapshotMutation()
  const deleteSnapshotMutation = useDeactivateSnapshotMutation({
    onSuccess: () => {
      console.log("[SnapshotsPage] Snapshot deleted successfully, invalidating queries...")
      queryClient.invalidateQueries({ queryKey: ["snapshots"] })
      queryClient.invalidateQueries({ queryKey: ["snapshots", "list"] })
      queryClient.invalidateQueries({ queryKey: ["snapshots", "active"] })
      refetch() // Force refetch to update the list
      setDeleteDialogOpen(false)
      setSnapshotToDelete(null)
    },
    onError: (error) => {
      console.error("[SnapshotsPage] Failed to delete snapshot:", error)
      alert(`Failed to delete snapshot: ${error.message}`)
    },
  })

  const snapshots = snapshotsData?.data || []
  
  // Debug: log snapshots to see structure
  if (snapshots.length > 0) {
    console.log("[SnapshotsPage] First snapshot structure:", snapshots[0])
  }
  const resume = resumesData?.resumes?.[0]
  const hasGithub = githubStatus?.connected ?? false

  const handleCreateSnapshot = () => {
    if (!resume?.id) {
      router.push("/dashboard/resume")
      return
    }

    if (!hasGithub) {
      router.push("/dashboard/github")
      return
    }

    createSnapshotMutation.mutate(
      {
        resumeId: resume.id,
        scanGitHub: true,
        triggerGitHubAnalysis: true,
      },
      {
        onSuccess: () => {
          // Refresh snapshots list
          window.location.reload()
        },
      }
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Snapshots</h1>
          <p className="text-muted-foreground">
            View and manage your career snapshots combining resume and GitHub data
          </p>
        </div>
        <Button
          onClick={handleCreateSnapshot}
          disabled={!resume || !hasGithub || createSnapshotMutation.isPending}
          size="lg"
        >
          {createSnapshotMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Create Snapshot
            </>
          )}
        </Button>
      </div>

      {!resume && (
        <Card className="border-yellow-500/50 bg-yellow-500/10">
          <CardContent className="pt-6">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Please upload a resume first to create snapshots.
            </p>
          </CardContent>
        </Card>
      )}

      {!hasGithub && (
        <Card className="border-yellow-500/50 bg-yellow-500/10">
          <CardContent className="pt-6">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Please connect your GitHub account first to create snapshots.
            </p>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : snapshots.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No snapshots yet</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              Create your first snapshot to combine your resume data with GitHub analysis
            </p>
            <Button onClick={handleCreateSnapshot} disabled={!resume || !hasGithub}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Snapshot
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {snapshots.map((snapshot: any) => (
            <Card 
              key={snapshot.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${snapshot.isActive ? "border-primary" : ""}`}
              onClick={() => router.push(`/dashboard/snapshots/${snapshot.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{snapshot.title || "Snapshot"}</CardTitle>
                  <div className="flex items-center gap-2">
                    {snapshot.isActive && <Badge>Active</Badge>}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation() // Prevent card click
                        console.log("[SnapshotsPage] Setting snapshot to delete:", snapshot.id, "Full snapshot:", snapshot)
                        setSnapshotToDelete(snapshot.id)
                        setDeleteDialogOpen(true)
                      }}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  Created {new Date(snapshot.createdAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {snapshot.yearsOfExperience && (
                  <div className="flex items-center gap-2 text-sm">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span>{snapshot.yearsOfExperience} years of experience</span>
                  </div>
                )}
                {snapshot.seniority && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="capitalize">{snapshot.seniority}</span>
                  </div>
                )}
                {snapshot.focus && (
                  <div className="flex items-center gap-2 text-sm">
                    <Code className="h-4 w-4 text-muted-foreground" />
                    <span className="capitalize">{snapshot.focus}</span>
                  </div>
                )}
                {snapshot.githubAnalysis && (
                  <Badge variant="outline" className="mt-2">
                    GitHub Analysis Available
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
          if (snapshotToDelete) {
            console.log("[SnapshotsPage] Deleting snapshot:", snapshotToDelete)
            deleteSnapshotMutation.mutate({ snapshotId: snapshotToDelete })
          } else {
            console.error("[SnapshotsPage] No snapshot ID to delete")
          }
        }}
      />
    </div>
  )
}

