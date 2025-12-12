import { Button } from "@/components/ui/button"
import { FileDown } from "lucide-react"

interface AchievementsHeaderProps {
  onExport: () => void
}

export function AchievementsHeader({ onExport }: AchievementsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">Achievements</h1>
        <p className="text-muted-foreground">Your resume-worthy achievements from GitHub</p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onExport}>
          <FileDown className="mr-2 h-4 w-4" />
          Export to Markdown
        </Button>
      </div>
    </div>
  )
}
