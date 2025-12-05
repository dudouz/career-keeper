import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import { BragCard } from "./brag-card"
import type { BragListItem } from "./types"

interface BragListProps {
  brags: BragListItem[]
  selectedBrags: Set<string>
  onSelectBrag: (bragId: string) => void
  onReviewBrag: (bragId: string) => void
}

export function BragList({ brags, selectedBrags, onSelectBrag, onReviewBrag }: BragListProps) {
  if (brags.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <AlertCircle className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-muted-foreground">No brags found matching your filters.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {brags.map((brag) => (
        <BragCard
          key={brag.id}
          brag={brag}
          isSelected={selectedBrags.has(brag.id)}
          onSelect={() => onSelectBrag(brag.id)}
          onReview={() => onReviewBrag(brag.id)}
        />
      ))}
    </div>
  )
}

