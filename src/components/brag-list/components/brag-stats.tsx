import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Check, FileText, Sparkles } from "lucide-react"
import type { BragStats } from "./types"

interface BragStatsProps {
  stats: BragStats
  selectedCount: number
}

export function BragStats({ stats, selectedCount }: BragStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Reviewed</CardTitle>
            <Check className="h-4 w-4 text-green-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.reviewed}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Archived</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-600">{stats.archived}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Selected</CardTitle>
            <Check className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{selectedCount}</div>
        </CardContent>
      </Card>
    </div>
  )
}

