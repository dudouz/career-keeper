// TODO: Check if this is needed, WHATS UP WITH THIS FILE?

import type { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers"
import type { Assertion, AsymmetricMatchersContaining } from "vitest"

declare module "vitest" {
  interface Assertion<T = unknown>
    extends jest.Matchers<void, T>,
      TestingLibraryMatchers<T, void> {}
  interface AsymmetricMatchersContaining extends jest.Matchers<void, unknown> {}
}
