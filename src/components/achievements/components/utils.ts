import type { AchievementListItem, SortOrder } from "./types"

export function filterAchievements(
  achievements: AchievementListItem[],
  searchQuery: string
): AchievementListItem[] {
  if (!searchQuery) return achievements

  const query = searchQuery.toLowerCase()
  return achievements.filter((achievement) => {
    return (
      achievement.title.toLowerCase().includes(query) ||
      achievement.repository.toLowerCase().includes(query) ||
      achievement.description?.toLowerCase().includes(query) ||
      achievement.customDescription?.toLowerCase().includes(query)
    )
  })
}

export function sortAchievements(
  achievements: AchievementListItem[],
  sortOrder: SortOrder
): AchievementListItem[] {
  const sorted = [...achievements]

  switch (sortOrder) {
    case "newest": {
      return sorted.sort((a, b) => {
        const dateA = typeof a.date === "string" ? new Date(a.date) : a.date
        const dateB = typeof b.date === "string" ? new Date(b.date) : b.date
        return dateB.getTime() - dateA.getTime()
      })
    }
    case "oldest": {
      return sorted.sort((a, b) => {
        const dateA = typeof a.date === "string" ? new Date(a.date) : a.date
        const dateB = typeof b.date === "string" ? new Date(b.date) : b.date
        return dateA.getTime() - dateB.getTime()
      })
    }
    case "most-impact": {
      return sorted.sort((a, b) => {
        const relevanceA = a.relevance || 0
        const relevanceB = b.relevance || 0
        return relevanceB - relevanceA
      })
    }
    default:
      return sorted
  }
}

export function exportAchievementsToMarkdown(achievements: AchievementListItem[]): void {
  let markdown = "# My Achievement List\n\n"
  markdown += `Generated on ${new Date().toLocaleDateString()}\n\n`

  const reviewedAchievements = achievements.filter(
    (achievement) => achievement.reviewStatus === "reviewed"
  )

  reviewedAchievements.forEach((achievement) => {
    const achievementDate =
      typeof achievement.date === "string" ? new Date(achievement.date) : achievement.date
    markdown += `## ${achievement.title}\n\n`
    markdown += `- **Type:** ${achievement.type.toUpperCase()}\n`
    markdown += `- **Repository:** ${achievement.repository}\n`
    markdown += `- **Date:** ${achievementDate.toLocaleDateString()}\n`
    if (achievement.relevance) {
      markdown += `- **Relevance:** ${achievement.relevance}/5\n`
    }
    if (achievement.techTags && achievement.techTags.length > 0) {
      markdown += `- **Technologies:** ${achievement.techTags.join(", ")}\n`
    }
    if (achievement.customDescription) {
      markdown += `- **Description:** ${achievement.customDescription}\n`
    }
    markdown += `- [View on GitHub](${achievement.url})\n\n`
  })

  const blob = new Blob([markdown], { type: "text/markdown" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `achievement-list-${new Date().toISOString().split("T")[0]}.md`
  a.click()
  URL.revokeObjectURL(url)
}
