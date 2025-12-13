"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Github, Star, Code, Search } from "lucide-react"
import type { Repository } from "@/lib/db/types"
import { useCreateProjectMutation, useProjectsQuery } from "@/lib/api/queries"

interface RepositorySelectorProps {
  repositories: Array<{
    name: string
    description?: string
    url: string
    language?: string
    stars?: number
  }>
  selectedRepositories: string[]
  onSelectionChange: (selected: string[]) => void
  onCreateProjects?: (repositories: Repository[]) => void
}

export function RepositorySelector({
  repositories,
  selectedRepositories,
  onSelectionChange,
  onCreateProjects,
}: RepositorySelectorProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const { data: projectsData } = useProjectsQuery()
  const createProjectMutation = useCreateProjectMutation()
  const existingProjects = (projectsData?.data || []) as Array<{ repositoryName: string }>

  // Filter repositories by search query
  const filteredRepositories = repositories.filter((repo) =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    repo.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleRepository = (repoName: string) => {
    if (selectedRepositories.includes(repoName)) {
      onSelectionChange(selectedRepositories.filter((name) => name !== repoName))
    } else {
      onSelectionChange([...selectedRepositories, repoName])
    }
  }

  const toggleAll = () => {
    if (selectedRepositories.length === filteredRepositories.length) {
      onSelectionChange([])
    } else {
      onSelectionChange(filteredRepositories.map((repo) => repo.name))
    }
  }

  const handleCreateProjects = async () => {
    const selectedRepos = repositories.filter((repo) => selectedRepositories.includes(repo.name))
    if (selectedRepos.length === 0) return

    try {
      const result = await createProjectMutation.mutateAsync({
        repositories: selectedRepos,
      })
      
      if (onCreateProjects) {
        onCreateProjects(selectedRepos)
      }
    } catch (error) {
      console.error("Failed to create projects:", error)
    }
  }

  const isProjectCreated = (repoName: string) => {
    return existingProjects.some((p) => p.repositoryName === repoName)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Github className="h-5 w-5" />
              Select Repositories to Analyze
            </CardTitle>
            <CardDescription>
              Choose which repositories to include in your analysis. You can save them as projects for future use.
            </CardDescription>
          </div>
          {filteredRepositories.length > 0 && (
            <Button variant="outline" size="sm" onClick={toggleAll}>
              {selectedRepositories.length === filteredRepositories.length ? "Deselect All" : "Select All"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search repositories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Repository List */}
        <div className="max-h-[400px] space-y-2 overflow-y-auto">
          {filteredRepositories.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {searchQuery ? "No repositories found matching your search." : "No repositories available."}
            </div>
          ) : (
            filteredRepositories.map((repo) => {
              const isSelected = selectedRepositories.includes(repo.name)
              const isCreated = isProjectCreated(repo.name)

              return (
                <Card
                  key={repo.name}
                  className={`cursor-pointer transition-colors ${
                    isSelected ? "border-primary bg-primary/5" : ""
                  }`}
                  onClick={() => toggleRepository(repo.name)}
                >
                  <CardContent className="flex items-start gap-3 p-4">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleRepository(repo.name)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{repo.name}</h4>
                        {isCreated && (
                          <Badge variant="secondary" className="text-xs">
                            Saved as Project
                          </Badge>
                        )}
                      </div>
                      {repo.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{repo.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {repo.language && (
                          <div className="flex items-center gap-1">
                            <Code className="h-3 w-3" />
                            {repo.language}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          {repo.stars || 0}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>

        {/* Selection Summary */}
        {selectedRepositories.length > 0 && (
          <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-3">
            <div className="text-sm">
              <span className="font-medium">{selectedRepositories.length}</span> repository
              {selectedRepositories.length !== 1 ? "ies" : ""} selected
            </div>
            <Button
              onClick={handleCreateProjects}
              disabled={createProjectMutation.isPending}
              size="sm"
            >
              {createProjectMutation.isPending ? "Saving..." : "Save as Projects"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

