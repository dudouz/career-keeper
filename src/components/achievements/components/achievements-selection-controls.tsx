import { Button } from "@/components/ui/button"

interface AchievementsSelectionControlsProps {
  totalCount: number
  selectedCount: number
  onSelectAll: () => void
  onEditSelected: () => void
  onClearSelection: () => void
}

export function AchievementsSelectionControls({
  totalCount,
  selectedCount,
  onSelectAll,
  onEditSelected,
  onClearSelection,
}: AchievementsSelectionControlsProps) {
  if (totalCount === 0) return null

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onSelectAll}>
          {selectedCount === totalCount ? "Deselect All" : "Select All"}
        </Button>
        {selectedCount > 0 && (
          <>
            <Button variant="outline" size="sm" onClick={onEditSelected}>
              Edit Selected ({selectedCount})
            </Button>
            <Button variant="outline" size="sm" onClick={onClearSelection}>
              Clear Selection
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
