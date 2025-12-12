import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { X } from "lucide-react"
import type { ResumeSectionOption } from "./types"

interface BulkEditPanelProps {
  selectedCount: number
  relevance?: number
  resumeSectionId: string | null
  techTags: string[]
  techTagInput: string
  isUpdating: boolean
  resumeSections: ResumeSectionOption[]
  onRelevanceChange: (value: number | undefined) => void
  onResumeSectionChange: (sectionId: string | null) => void
  onTechTagAdd: (tag: string) => void
  onTechTagRemove: (tag: string) => void
  onTechTagInputChange: (value: string) => void
  onUpdate: () => void
  onArchive: () => void
  onCancel: () => void
  onClose: () => void
}

export function BulkEditPanel({
  selectedCount,
  relevance,
  resumeSectionId,
  techTags,
  techTagInput,
  isUpdating,
  resumeSections,
  onRelevanceChange,
  onResumeSectionChange,
  onTechTagAdd,
  onTechTagRemove,
  onTechTagInputChange,
  onUpdate,
  onArchive,
  onCancel,
  onClose,
}: BulkEditPanelProps) {
  const handleAddTechTag = () => {
    if (techTagInput.trim() && !techTags.includes(techTagInput.trim())) {
      onTechTagAdd(techTagInput.trim())
    }
  }

  return (
    <Card className="border-blue-500 bg-blue-50 dark:bg-blue-950">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Bulk Edit ({selectedCount} selected)</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bulk Relevance */}
        <div>
          <label className="mb-2 block text-sm font-medium">Relevance (1-5)</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <Button
                key={value}
                type="button"
                variant={relevance === value ? "default" : "outline"}
                size="sm"
                onClick={() => onRelevanceChange(value)}
              >
                {value}
              </Button>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onRelevanceChange(undefined)}
            >
              Clear
            </Button>
          </div>
        </div>

        {/* Bulk Resume Section */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Associate with Resume Experience
          </label>
          <Select
            value={resumeSectionId || "none"}
            onValueChange={(value) => onResumeSectionChange(value === "none" ? null : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="None (don't associate)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None (don't associate)</SelectItem>
              {resumeSections.map((section) => (
                <SelectItem key={section.id} value={section.id}>
                  {section.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Bulk Tech Tags */}
        <div>
          <label className="mb-2 block text-sm font-medium">Technologies (Tags)</label>
          <div className="mb-2 flex gap-2">
            <Input
              value={techTagInput}
              onChange={(e) => onTechTagInputChange(e.target.value)}
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
                  onClick={() => onTechTagRemove(tag)}
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
          <Button onClick={onUpdate} disabled={isUpdating}>
            {isUpdating ? "Saving..." : "Apply Changes"}
          </Button>
          <Button variant="outline" onClick={onArchive} disabled={isUpdating}>
            Archive Selected
          </Button>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

