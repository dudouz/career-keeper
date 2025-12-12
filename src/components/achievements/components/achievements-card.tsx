import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Edit, ExternalLink } from "lucide-react"
import { AchievementTypeIcon } from "./achievement-type-icon"
import type { AchievementListItem } from "./types"

interface AchievementsCardProps {
  achievement: AchievementListItem
  isSelected: boolean
  onSelect: () => void
  onReview: () => void
}

export function AchievementsCard({
  achievement,
  isSelected,
  onSelect,
  onReview,
}: AchievementsCardProps) {
  const achievementDate =
    typeof achievement.date === "string" ? new Date(achievement.date) : achievement.date

  return (
    <Card
      className={`transition-shadow hover:shadow-md ${isSelected ? "ring-2 ring-blue-500" : ""}`}
    >
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          {/* Checkbox */}
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => {
              if (checked !== isSelected) {
                onSelect()
              }
            }}
            className="mt-1"
          />

          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <AchievementTypeIcon type={achievement.type} />
              <Badge variant={achievement.reviewStatus === "reviewed" ? "default" : "secondary"}>
                {achievement.type.toUpperCase()}
              </Badge>
              {achievement.reviewStatus === "pending" && (
                <Badge variant="outline" className="text-yellow-600">
                  Pending
                </Badge>
              )}
              {achievement.relevance && (
                <Badge variant="outline">Relevance: {achievement.relevance}/5</Badge>
              )}
            </div>
            <h3 className="text-lg font-semibold">{achievement.title}</h3>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{achievement.repository}</span>
              <span>•</span>
              <span>{achievementDate.toLocaleDateString()}</span>
            </div>
            {achievement.description && (
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {achievement.description}
              </p>
            )}
            {achievement.customDescription && (
              <p className="text-sm text-foreground">{achievement.customDescription}</p>
            )}
            {achievement.techTags && achievement.techTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {achievement.techTags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(achievement.url, "_blank")}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View
            </Button>
            {achievement.reviewStatus === "pending" ? (
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
