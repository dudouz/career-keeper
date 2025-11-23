import { describe, it, expect, beforeEach } from "vitest"
import { rateLimit, clearRateLimitStore } from "./rate-limit"

describe("Rate Limiting", () => {
  beforeEach(() => {
    // Clear rate limit store between tests
    clearRateLimitStore()
  })

  describe("rateLimit", () => {
    it("should allow requests within limit", () => {
      const limiter = rateLimit({
        interval: 60000, // 1 minute
        maxRequests: 5,
      })

      const result1 = limiter.check("user1")
      const result2 = limiter.check("user1")
      const result3 = limiter.check("user1")

      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
      expect(result3.success).toBe(true)
      expect(result3.remaining).toBe(2)
    })

    it("should block requests over limit", () => {
      const limiter = rateLimit({
        interval: 60000,
        maxRequests: 3,
      })

      limiter.check("user1")
      limiter.check("user1")
      limiter.check("user1")
      const result = limiter.check("user1")

      expect(result.success).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it("should track different identifiers separately", () => {
      const limiter = rateLimit({
        interval: 60000,
        maxRequests: 2,
      })

      const result1 = limiter.check("user1")
      const result2 = limiter.check("user2")

      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
      expect(result1.remaining).toBe(1)
      expect(result2.remaining).toBe(1)
    })

    it("should decrement remaining count", () => {
      const limiter = rateLimit({
        interval: 60000,
        maxRequests: 5,
      })

      const result1 = limiter.check("user1")
      expect(result1.remaining).toBe(4)

      const result2 = limiter.check("user1")
      expect(result2.remaining).toBe(3)

      const result3 = limiter.check("user1")
      expect(result3.remaining).toBe(2)
    })

    it("should handle limit of 1", () => {
      const limiter = rateLimit({
        interval: 60000,
        maxRequests: 1,
      })

      const result1 = limiter.check("user1")
      expect(result1.success).toBe(true)
      expect(result1.remaining).toBe(0)

      const result2 = limiter.check("user1")
      expect(result2.success).toBe(false)
      expect(result2.remaining).toBe(0)
    })
  })
})

