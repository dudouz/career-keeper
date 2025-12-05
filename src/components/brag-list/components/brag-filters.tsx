import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import type { BragType } from "@/lib/db/types"
import type { ReviewStatusFilter, SortOrder } from "./types"

interface BragFiltersProps {
  searchQuery: string
  reviewStatusFilter: ReviewStatusFilter
  typeFilter: BragType | "all"
  sortOrder: SortOrder
  onSearchChange: (query: string) => void
  onReviewStatusChange: (filter: ReviewStatusFilter) => void
  onTypeChange: (filter: BragType | "all") => void
  onSortChange: (order: SortOrder) => void
}

export function BragFilters({
  searchQuery,
  reviewStatusFilter,
  typeFilter,
  sortOrder,
  onSearchChange,
  onReviewStatusChange,
  onTypeChange,
  onSortChange,
}: BragFiltersProps) {
  return (
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
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Review Status Filter */}
          <select
            value={reviewStatusFilter}
            onChange={(e) => onReviewStatusChange(e.target.value as ReviewStatusFilter)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="archived">Archived</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => onTypeChange(e.target.value as BragType | "all")}
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
            onChange={(e) => onSortChange(e.target.value as SortOrder)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="most-impact">Most Impact</option>
          </select>
        </div>
      </CardContent>
    </Card>
  )
}

