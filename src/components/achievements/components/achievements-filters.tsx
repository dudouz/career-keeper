import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { AchievementType } from "@/lib/db/types"
import { Search } from "lucide-react"
import type { ReviewStatusFilter, SortOrder } from "./types"

interface AchievementsFiltersProps {
  searchQuery: string
  reviewStatusFilter: ReviewStatusFilter
  typeFilter: AchievementType | "all"
  sortOrder: SortOrder
  onSearchChange: (query: string) => void
  onReviewStatusChange: (filter: ReviewStatusFilter) => void
  onTypeChange: (filter: AchievementType | "all") => void
  onSortChange: (order: SortOrder) => void
}

export function AchievementsFilters({
  searchQuery,
  reviewStatusFilter,
  typeFilter,
  sortOrder,
  onSearchChange,
  onReviewStatusChange,
  onTypeChange,
  onSortChange,
}: AchievementsFiltersProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4 md:flex-row">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search achievements..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Review Status Filter */}
          <Select value={reviewStatusFilter} onValueChange={onReviewStatusChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>

          {/* Type Filter */}
          <Select value={typeFilter} onValueChange={onTypeChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="commit">Commits</SelectItem>
              <SelectItem value="pr">Pull Requests</SelectItem>
              <SelectItem value="issue">Issues</SelectItem>
              <SelectItem value="release">Releases</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort Order */}
          <Select value={sortOrder} onValueChange={onSortChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="most-impact">Most Impact</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}
