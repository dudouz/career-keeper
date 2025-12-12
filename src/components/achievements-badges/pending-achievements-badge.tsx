"use client"

import { Badge } from "@/components/ui/badge"
import { useAchievementStatsQuery } from "@/lib/api/queries"
import { AlertCircle } from "lucide-react"
import Link from "next/link"

export function PendingAchievementsBadge() {
  const { data: stats, isLoading } = useAchievementStatsQuery()

  if (isLoading || !stats || stats.pending === 0) {
    return null
  }

  return (
    <Link href="/dashboard/achievements?filter=pending">
      <Badge variant="destructive" className="gap-1">
        <AlertCircle className="h-3 w-3" />
        {stats.pending}
      </Badge>
    </Link>
  )
}
