import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Edit, ExternalLink } from "lucide-react"
import { BragTypeIcon } from "./brag-type-icon"
import type { BragListItem } from "./types"

interface BragCardProps {
  brag: BragListItem
  isSelected: boolean
  onSelect: () => void
  onReview: () => void
}

export function BragCard({ brag, isSelected, onSelect, onReview }: BragCardProps) {
  const bragDate = typeof brag.date === "string" ? new Date(brag.date) : brag.date

  return (
    <Card
      className={`transition-shadow hover:shadow-md ${
        isSelected ? "ring-2 ring-blue-500" : ""
      }`}
    >
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          {/* Checkbox */}
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onSelect()}
            className="mt-1"
          />

          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <BragTypeIcon type={brag.type} />
              <Badge variant={brag.reviewStatus === "reviewed" ? "default" : "secondary"}>
                {brag.type.toUpperCase()}
              </Badge>
              {brag.reviewStatus === "pending" && (
                <Badge variant="outline" className="text-yellow-600">
                  Pending
                </Badge>
              )}
              {brag.relevance && (
                <Badge variant="outline">Relevance: {brag.relevance}/5</Badge>
              )}
            </div>
            <h3 className="text-lg font-semibold">{brag.title}</h3>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{brag.repository}</span>
              <span>•</span>
              <span>{bragDate.toLocaleDateString()}</span>
            </div>
            {brag.description && (
              <p className="line-clamp-2 text-sm text-muted-foreground">{brag.description}</p>
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
            <Button variant="outline" size="sm" onClick={() => window.open(brag.url, "_blank")}>
              <ExternalLink className="mr-2 h-4 w-4" />
              View
            </Button>
            {brag.reviewStatus === "pending" ? (
              <Button size="sm" onClick={onReview}>
                Review
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={onReview}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

