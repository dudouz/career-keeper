import * as matchers from "@testing-library/jest-dom/matchers"
import { cleanup } from "@testing-library/react"
import { afterEach, expect } from "vitest"

expect.extend(matchers)

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock environment variables for tests
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test"
process.env.AUTH_SECRET = "test-secret-key-for-testing-only"
process.env.SESSION_ENCRYPTION_KEY = "test-encryption-key-for-testing"
