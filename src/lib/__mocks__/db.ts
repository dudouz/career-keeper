import { vi } from "vitest"

// Generic type for database records
type DbRecord = Record<string, unknown>

// Create a proper chainable mock for select
function createSelectMock<T extends DbRecord = DbRecord>(returnValue: T[] = []) {
  return {
    from: vi.fn(() => ({
      where: vi.fn(() => Promise.resolve(returnValue)),
    })),
  }
}

// Create a proper chainable mock for insert
function createInsertMock<T extends DbRecord = DbRecord>(returnValue: T[] = []) {
  return {
    values: vi.fn(() => ({
      returning: vi.fn(() => Promise.resolve(returnValue)),
    })),
  }
}

// Mock database for testing
export const mockDb = {
  select: vi.fn(() => createSelectMock()),
  insert: vi.fn(() => createInsertMock()),
  update: vi.fn(() => ({
    set: vi.fn(() => ({
      where: vi.fn(() => Promise.resolve([])),
    })),
  })),
  delete: vi.fn(() => ({
    where: vi.fn(() => Promise.resolve([])),
  })),
}

// Helper to set up select mock with return value
export function mockSelectReturn<T extends DbRecord = DbRecord>(data: T[]) {
  mockDb.select.mockReturnValue(createSelectMock(data))
}

// Helper to set up insert mock with return value
export function mockInsertReturn<T extends DbRecord = DbRecord>(data: T[]) {
  mockDb.insert.mockReturnValue(createInsertMock(data))
}

// Mock user data (OAuth-only)
export const mockUser = {
  id: "test-user-id",
  email: "test@example.com",
  name: "Test User",
  image: "https://example.com/avatar.jpg",
  emailVerified: new Date("2025-01-01"),
  subscriptionTier: "free",
  subscriptionStatus: null,
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
}

// Mock resume data
export const mockResume = {
  id: "test-resume-id",
  userId: "test-user-id",
  rawText: "Mock resume content",
  parsedContent: {
    summary: "Experienced developer",
    experience: [],
    skills: ["JavaScript", "TypeScript"],
    education: [],
    projects: [],
  },
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
}

// Mock GitHub contribution data
export const mockGitHubContribution = {
  id: "test-contribution-id",
  userId: "test-user-id",
  type: "commit",
  repository: "test/repo",
  title: "Test commit",
  description: "Test description",
  url: "https://github.com/test/repo",
  date: new Date("2025-01-01"),
  createdAt: new Date("2025-01-01"),
}

// Reset all mocks
export function resetDbMocks() {
  Object.values(mockDb).forEach((mock) => {
    if (typeof mock === "function" && "mockReset" in mock) {
      mock.mockReset()
    }
  })
}

