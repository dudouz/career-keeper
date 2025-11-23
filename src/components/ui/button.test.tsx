import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Button } from "./button"

describe("Button Component", () => {
  it("should render button with text", () => {
    render(<Button>Click me</Button>)

    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument()
  })

  it("should handle click events", async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()

    render(<Button onClick={handleClick}>Click me</Button>)

    const button = screen.getByRole("button")
    await user.click(button)

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it("should render with different variants", () => {
    const { container: defaultContainer } = render(<Button>Default</Button>)
    const { container: destructiveContainer } = render(
      <Button variant="destructive">Destructive</Button>
    )
    const { container: outlineContainer } = render(
      <Button variant="outline">Outline</Button>
    )

    expect(defaultContainer.querySelector("button")).toBeInTheDocument()
    expect(destructiveContainer.querySelector("button")).toBeInTheDocument()
    expect(outlineContainer.querySelector("button")).toBeInTheDocument()
  })

  it("should render with different sizes", () => {
    render(<Button size="sm">Small</Button>)
    render(<Button size="lg">Large</Button>)

    expect(screen.getByText("Small")).toBeInTheDocument()
    expect(screen.getByText("Large")).toBeInTheDocument()
  })

  it("should be disabled when disabled prop is true", async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()

    render(
      <Button disabled onClick={handleClick}>
        Disabled
      </Button>
    )

    const button = screen.getByRole("button")
    expect(button).toBeDisabled()

    await user.click(button)
    expect(handleClick).not.toHaveBeenCalled()
  })

  it("should render as child component when asChild is true", () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    )

    expect(screen.getByRole("link")).toBeInTheDocument()
    expect(screen.getByText("Link Button")).toBeInTheDocument()
  })
})

