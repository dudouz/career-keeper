import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { StatsCard } from "./stats-card"

describe("StatsCard Component", () => {
  it("should render title, value, and description", () => {
    render(
      <StatsCard
        title="Total Commits"
        value="142"
        description="Last 30 days"
      />
    )

    expect(screen.getByText("Total Commits")).toBeInTheDocument()
    expect(screen.getByText("142")).toBeInTheDocument()
    expect(screen.getByText("Last 30 days")).toBeInTheDocument()
  })

  it("should render without description", () => {
    render(<StatsCard title="Pull Requests" value="23" />)

    expect(screen.getByText("Pull Requests")).toBeInTheDocument()
    expect(screen.getByText("23")).toBeInTheDocument()
  })

  it("should handle numeric values", () => {
    render(<StatsCard title="Issues Closed" value={45} />)

    expect(screen.getByText("45")).toBeInTheDocument()
  })

  it("should handle zero values", () => {
    render(<StatsCard title="Open Issues" value={0} />)

    expect(screen.getByText("0")).toBeInTheDocument()
  })

  it("should render with long descriptions", () => {
    const longDescription =
      "This is a very long description that might wrap to multiple lines"

    render(
      <StatsCard
        title="Achievements"
        value="100"
        description={longDescription}
      />
    )

    expect(screen.getByText(longDescription)).toBeInTheDocument()
  })
})

