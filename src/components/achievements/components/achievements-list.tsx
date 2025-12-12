import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import { AchievementsCard } from "./achievements-card"
import type { AchievementListItem } from "./types"

interface AchievementsListProps {
  achievements: AchievementListItem[]
  selectedAchievements: Set<string>
  onSelectAchievement: (achievementId: string) => void
  onReviewAchievement: (achievementId: string) => void
}

export function AchievementsList({
  achievements,
  selectedAchievements,
  onSelectAchievement,
  onReviewAchievement,
}: AchievementsListProps) {
  if (achievements.length === 0) {
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
      {achievements.map((achievement) => (
        <AchievementsCard
          key={achievement.id}
          achievement={achievement}
          isSelected={selectedAchievements.has(achievement.id)}
          onSelect={() => onSelectAchievement(achievement.id)}
          onReview={() => onReviewAchievement(achievement.id)}
        />
      ))}
    </div>
  )
}
