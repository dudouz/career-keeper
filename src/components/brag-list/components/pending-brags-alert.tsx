import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import type { ReviewStatusFilter } from "./types"

interface PendingBragsAlertProps {
  pendingCount: number
  onReviewClick: () => void
}

export function PendingBragsAlert({ pendingCount, onReviewClick }: PendingBragsAlertProps) {
  if (pendingCount === 0) return null

  return (
    <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <p className="font-medium">
              You have <strong>{pendingCount}</strong> pending brag{pendingCount !== 1 ? "s" : ""} to review
            </p>
          </div>
          <Button
            variant="outline"
            onClick={onReviewClick}
            className="border-yellow-600 text-yellow-700 hover:bg-yellow-100"
          >
            Review Now
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

