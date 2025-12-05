import type { BragListItem, SortOrder } from "./types"

export function filterBrags(brags: BragListItem[], searchQuery: string): BragListItem[] {
  if (!searchQuery) return brags

  const query = searchQuery.toLowerCase()
  return brags.filter((brag) => {
    return (
      brag.title.toLowerCase().includes(query) ||
      brag.repository.toLowerCase().includes(query) ||
      brag.description?.toLowerCase().includes(query) ||
      brag.customDescription?.toLowerCase().includes(query)
    )
  })
}

export function sortBrags(brags: BragListItem[], sortOrder: SortOrder): BragListItem[] {
  const sorted = [...brags]

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

export function exportBragsToMarkdown(brags: BragListItem[]): void {
  let markdown = "# My Brag List\n\n"
  markdown += `Generated on ${new Date().toLocaleDateString()}\n\n`

  const reviewedBrags = brags.filter((b) => b.reviewStatus === "reviewed")

  reviewedBrags.forEach((brag) => {
    const bragDate = typeof brag.date === "string" ? new Date(brag.date) : brag.date
    markdown += `## ${brag.title}\n\n`
    markdown += `- **Type:** ${brag.type.toUpperCase()}\n`
    markdown += `- **Repository:** ${brag.repository}\n`
    markdown += `- **Date:** ${bragDate.toLocaleDateString()}\n`
    if (brag.relevance) {
      markdown += `- **Relevance:** ${brag.relevance}/5\n`
    }
    if (brag.techTags && brag.techTags.length > 0) {
      markdown += `- **Technologies:** ${brag.techTags.join(", ")}\n`
    }
    if (brag.customDescription) {
      markdown += `- **Description:** ${brag.customDescription}\n`
    }
    markdown += `- [View on GitHub](${brag.url})\n\n`
  })

  const blob = new Blob([markdown], { type: "text/markdown" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `brag-list-${new Date().toISOString().split("T")[0]}.md`
  a.click()
  URL.revokeObjectURL(url)
}

