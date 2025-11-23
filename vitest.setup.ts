import { expect, afterEach } from "vitest"
import { cleanup } from "@testing-library/react"
import * as matchers from "@testing-library/jest-dom/matchers"

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers)

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock environment variables for tests
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test"
process.env.AUTH_SECRET = "test-secret-key-for-testing-only"
process.env.SESSION_ENCRYPTION_KEY = "test-encryption-key-for-testing"

