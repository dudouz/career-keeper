import { Button } from "@/components/ui/button"
import { FileDown } from "lucide-react"

interface BragHeaderProps {
  onExport: () => void
}

export function BragHeader({ onExport }: BragHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">Brag List</h1>
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

