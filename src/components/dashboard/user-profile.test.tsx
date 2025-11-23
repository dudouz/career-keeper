import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { UserProfile } from "./user-profile"

// Create a mock function for useSession
const mockUseSession = vi.fn()

// Mock next-auth
vi.mock("next-auth/react", () => ({
  useSession: () => mockUseSession(),
}))

describe("UserProfile Component", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should render user name and email", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          name: "Test User",
          email: "test@example.com",
          subscriptionTier: "basic",
        },
      },
      status: "authenticated",
    })

    render(<UserProfile />)

    expect(screen.getByText("Test User")).toBeInTheDocument()
    expect(screen.getByText("test@example.com")).toBeInTheDocument()
  })

  it("should display basic subscription tier", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          name: "Basic User",
          email: "basic@example.com",
          subscriptionTier: "basic",
        },
      },
      status: "authenticated",
    })

    render(<UserProfile />)

    expect(screen.getByText("Basic")).toBeInTheDocument()
  })

  it("should render with premium tier", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          name: "Premium User",
          email: "user@example.com",
          subscriptionTier: "premium",
        },
      },
      status: "authenticated",
    })

    render(<UserProfile />)

    expect(screen.getByText("Premium User")).toBeInTheDocument()
    expect(screen.getByText("Premium")).toBeInTheDocument()
  })

  it("should not render when no session", () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    })

    const { container } = render(<UserProfile />)

    expect(container.firstChild).toBeNull()
  })

  it("should not render name field when name is missing", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          email: "noname@example.com",
          subscriptionTier: "basic",
        },
      },
      status: "authenticated",
    })

    render(<UserProfile />)

    expect(screen.getByText("noname@example.com")).toBeInTheDocument()
    expect(screen.queryByText("Name")).not.toBeInTheDocument()
  })
})

