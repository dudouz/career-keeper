import { describe, it, expect } from "vitest"
import { encryptToken, decryptToken } from "./encryption"

describe("GitHub Encryption", () => {
  describe("encryptToken and decryptToken", () => {
    it("should encrypt and decrypt a token", () => {
      const originalToken = "ghp_testToken123456789"
      const encrypted = encryptToken(originalToken)
      const decrypted = decryptToken(encrypted)

      expect(encrypted).not.toBe(originalToken)
      expect(decrypted).toBe(originalToken)
    })

    it("should produce different encrypted values for same token", () => {
      const token = "ghp_testToken123456789"
      const encrypted1 = encryptToken(token)
      const encrypted2 = encryptToken(token)

      // AES encryption with IV should produce different ciphertext
      expect(encrypted1).not.toBe(encrypted2)
      expect(decryptToken(encrypted1)).toBe(token)
      expect(decryptToken(encrypted2)).toBe(token)
    })

    it("should handle empty token", () => {
      const token = ""
      const encrypted = encryptToken(token)
      const decrypted = decryptToken(encrypted)

      expect(decrypted).toBe(token)
    })

    it("should handle long tokens", () => {
      const token = "ghp_" + "a".repeat(100)
      const encrypted = encryptToken(token)
      const decrypted = decryptToken(encrypted)

      expect(decrypted).toBe(token)
    })

    it("should handle special characters", () => {
      const token = "token_with_!@#$%^&*()_special_chars"
      const encrypted = encryptToken(token)
      const decrypted = decryptToken(encrypted)

      expect(decrypted).toBe(token)
    })
  })
})

