/**
 * Vitest type declarations for @testing-library/jest-dom matchers
 * This extends Vitest's Assertion interface to include jest-dom matchers
 */

import type { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers"

declare module "vitest" {
  interface Assertion<T = unknown>
    extends jest.Matchers<void, T>,
      TestingLibraryMatchers<T, void> {}
}
