"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useResumesQuery, useUpdateBragReviewMutation } from "@/lib/api/queries"
import type { BragType } from "@/lib/db/types"
import { ExternalLink, FileText, GitCommit, GitPullRequest, Rocket, X } from "lucide-react"
import { useState } from "react"

interface BragReviewModalProps {
  brag: {
    id: string
    type: BragType
    title: string
    description?: string | null
    date: Date
    repository: string
    url: string
    relevance?: number | null
    resumeSectionId?: string | null
    techTags?: string[] | null
    customDescription?: string | null
  }
  onClose: () => void
  onSave: () => void
}

export function BragReviewModal({ brag, onClose, onSave }: BragReviewModalProps) {
  const { data: resumesData } = useResumesQuery()
  const updateMutation = useUpdateBragReviewMutation()

  const [relevance, setRelevance] = useState<number | undefined>(brag.relevance || undefined)
  const [resumeSectionId, setResumeSectionId] = useState<string | null>(
    brag.resumeSectionId || null
  )
  const [techTags, setTechTags] = useState<string[]>(brag.techTags || [])
  const [techTagInput, setTechTagInput] = useState("")
  const [customDescription, setCustomDescription] = useState<string>(brag.customDescription || "")

  // Get all resume sections from all resumes
  const resumes = resumesData?.resumes || []
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
      bragId: brag.id,
      relevance,
      resumeSectionId,
      techTags,
      customDescription: customDescription || null,
    })
    onSave()
    onClose()
  }

  const getTypeIcon = () => {
    switch (brag.type) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                {getTypeIcon()}
                <Badge variant="secondary">{brag.type.toUpperCase()}</Badge>
              </div>
              <CardTitle className="text-xl">{brag.title}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {brag.repository} • {new Date(brag.date).toLocaleDateString()}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Original Description */}
          {brag.description && (
            <div>
              <label className="text-sm font-medium">Descrição Original</label>
              <p className="mt-1 text-sm text-muted-foreground">{brag.description}</p>
            </div>
          )}

          {/* Relevance */}
          <div>
            <label className="mb-2 block text-sm font-medium">Relevância (1-5)</label>
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
              Associar a Experiência do Currículo
            </label>
            <select
              value={resumeSectionId || ""}
              onChange={(e) => setResumeSectionId(e.target.value || null)}
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

          {/* Tech Tags */}
          <div>
            <label className="mb-2 block text-sm font-medium">Tecnologias (Tags)</label>
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
                placeholder="Digite uma tecnologia e pressione Enter"
              />
              <Button type="button" onClick={handleAddTechTag}>
                Adicionar
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
              Descrição Customizada (O que foi feito)
            </label>
            <Textarea
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
              placeholder="Descreva o que foi feito neste brag..."
              rows={4}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Salvando..." : "Salvar Revisão"}
            </Button>
          </div>

          {/* Link to GitHub */}
          <div className="border-t pt-2">
            <Button variant="outline" size="sm" asChild className="w-full">
              <a href={brag.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Ver no GitHub
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
