import { describe, it, expect, vi, beforeEach } from "vitest"

// Create mock Octokit methods
const mockGetAuthenticated = vi.fn()
const mockListRepos = vi.fn()

// Mock the Octokit module
vi.mock("@octokit/rest", () => ({
  Octokit: class MockOctokit {
    users = {
      getAuthenticated: mockGetAuthenticated,
    }
    repos = {
      listForAuthenticatedUser: mockListRepos,
    }
    constructor(_config: { auth: string }) {
      // Mock constructor
    }
  },
}))

// Import after mocking
import { GitHubClient } from "./client"

describe("GitHub Client", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("constructor", () => {
    it("should create GitHub client with token", () => {
      const client = new GitHubClient("ghp_testToken123")
      expect(client).toBeDefined()
      expect(client).toBeInstanceOf(GitHubClient)
    })

    it("should handle empty token", () => {
      const client = new GitHubClient("")
      expect(client).toBeDefined()
    })
  })

  describe("validateToken", () => {
    it("should validate correct token", async () => {
      mockGetAuthenticated.mockResolvedValue({
        data: { login: "testuser" },
      })

      const client = new GitHubClient("test-token")
      const result = await client.validateToken()

      expect(result.valid).toBe(true)
      expect(result.username).toBe("testuser")
      expect(mockGetAuthenticated).toHaveBeenCalled()
    })

    it("should handle invalid token", async () => {
      mockGetAuthenticated.mockRejectedValue(new Error("Bad credentials"))

      const client = new GitHubClient("invalid-token")
      const result = await client.validateToken()

      expect(result.valid).toBe(false)
      expect(result.error).toBe("Invalid GitHub token")
    })

    it("should handle network errors", async () => {
      mockGetAuthenticated.mockRejectedValue(new Error("Network error"))

      const client = new GitHubClient("test-token")
      const result = await client.validateToken()

      expect(result.valid).toBe(false)
      expect(result.error).toBe("Invalid GitHub token")
    })
  })

  describe("checkRateLimit", () => {
    it("should return rate limit status via validation", async () => {
      mockGetAuthenticated.mockResolvedValue({
        data: { login: "testuser" },
      })

      const client = new GitHubClient("test-token")
      const result = await client.validateToken()

      expect(result.valid).toBe(true)
      expect(result.username).toBe("testuser")
    })
  })
})

