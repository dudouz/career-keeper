import { AchievementType } from "@/lib/db/types"
import { FileText, GitCommit, GitPullRequest, Rocket } from "lucide-react"

export function AchievementTypeIcon({ type }: { type: AchievementType }) {
  switch (type) {
    case "commit":
      return <GitCommit className="h-4 w-4" />
    case "pr":
      return <GitPullRequest className="h-4 w-4" />
    case "issue":
      return <FileText className="h-4 w-4" />
    case "release":
      return <Rocket className="h-4 w-4" />
  }
}
