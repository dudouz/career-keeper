/**
 * Simple in-memory rate limiting utility
 *
 * Purpose: Prevents abuse and protects API endpoints by limiting the number of
 * requests from a single identifier (e.g., IP address, user ID) within a time window.
 *
 * Use cases:
 * - authLimiter: Protects authentication endpoints from brute force attacks
 * - apiLimiter: Prevents API abuse by limiting general API requests
 *
 * Note: For production with multiple server instances, use Redis or a dedicated
 * rate limiting service to share state across instances.
 */

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

// Helper for testing - clear the rate limit store
export function clearRateLimitStore() {
  Object.keys(store).forEach((key) => delete store[key])
}

export interface RateLimitOptions {
  interval: number // Time window in milliseconds
  maxRequests: number // Maximum requests per interval
}

export function rateLimit(options: RateLimitOptions) {
  return {
    check: (identifier: string): { success: boolean; remaining: number } => {
      const now = Date.now()
      const key = identifier

      // Clean up expired entries
      if (store[key] && now > store[key].resetTime) {
        delete store[key]
      }

      // Initialize or get existing entry
      if (!store[key]) {
        store[key] = {
          count: 0,
          resetTime: now + options.interval,
        }
      }

      // Check if limit exceeded
      if (store[key].count >= options.maxRequests) {
        return {
          success: false,
          remaining: 0,
        }
      }

      // Increment counter
      store[key].count++

      return {
        success: true,
        remaining: options.maxRequests - store[key].count,
      }
    },
  }
}

// Rate limiters for different endpoints
export const authLimiter = rateLimit({
  interval: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 attempts per 15 minutes
})

export const apiLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  maxRequests: 60, // 60 requests per minute
})
