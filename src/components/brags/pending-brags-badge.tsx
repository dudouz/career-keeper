"use client"

import { Badge } from "@/components/ui/badge"
import { useBragStatsQuery } from "@/lib/api/queries"
import { AlertCircle } from "lucide-react"
import Link from "next/link"

export function PendingBragsBadge() {
  const { data: stats, isLoading } = useBragStatsQuery()

  if (isLoading || !stats || stats.pending === 0) {
    return null
  }

  return (
    <Link href="/dashboard/brag-list?filter=pending">
      <Badge variant="destructive" className="gap-1">
        <AlertCircle className="h-3 w-3" />
        {stats.pending}
      </Badge>
    </Link>
  )
}
