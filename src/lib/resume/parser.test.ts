import { describe, it, expect } from "vitest"
import { parseTXT, extractResumeSections } from "./parser"

describe("Resume Parser", () => {
  describe("parseTXT", () => {
    it("should parse plain text buffer", () => {
      const text = "Hello World"
      const buffer = Buffer.from(text, "utf-8")
      const result = parseTXT(buffer)

      expect(result).toBe(text)
    })

    it("should handle empty buffer", () => {
      const buffer = Buffer.from("", "utf-8")
      const result = parseTXT(buffer)

      expect(result).toBe("")
    })

    it("should handle UTF-8 characters", () => {
      const text = "Hello 世界 🌍"
      const buffer = Buffer.from(text, "utf-8")
      const result = parseTXT(buffer)

      expect(result).toBe(text)
    })
  })

  describe("extractResumeSections", () => {
    it("should extract summary section", () => {
      const text = `
        Summary
        Experienced software developer with 5 years of expertise
      `
      const result = extractResumeSections(text)

      expect(result.summary).toBeDefined()
      expect(result.summary).toContain("Summary")
    })

    it("should extract experience section", () => {
      const text = `
        Experience
        Senior Software Engineer
        Tech Company Inc.
        Developed web applications
      `
      const result = extractResumeSections(text)

      expect(result.experience).toBeDefined()
      expect(result.experience?.length).toBeGreaterThan(0)
    })

    it("should extract skills section", () => {
      const text = `
        Skills
        JavaScript, TypeScript, React, Node.js
      `
      const result = extractResumeSections(text)

      expect(result.skills).toBeDefined()
      expect(result.skills?.length).toBeGreaterThan(0)
      expect(result.skills).toContain("JavaScript")
    })

    it("should extract education section", () => {
      const text = `
        Education
        Bachelor of Science in Computer Science
        University of Technology
      `
      const result = extractResumeSections(text)

      expect(result.education).toBeDefined()
      expect(result.education?.length).toBeGreaterThan(0)
    })

    it("should handle resume with no clear sections", () => {
      const text = "Just some random text without sections"
      const result = extractResumeSections(text)

      expect(result).toBeDefined()
      expect(result.experience).toEqual([])
      expect(result.skills).toEqual([])
    })

    it("should handle empty text", () => {
      const text = ""
      const result = extractResumeSections(text)

      expect(result).toBeDefined()
      expect(result.experience).toEqual([])
      expect(result.skills).toEqual([])
    })

    it("should extract projects section", () => {
      const text = `
        Projects
        E-commerce Platform
        Built a full-stack e-commerce solution
        Portfolio Website
        Personal portfolio with React
      `
      const result = extractResumeSections(text)

      expect(result.projects).toBeDefined()
      expect(result.projects?.length).toBeGreaterThan(0)
    })

    it("should parse comma-separated skills", () => {
      const text = `
        Skills
        React, Vue, Angular, Svelte
      `
      const result = extractResumeSections(text)

      expect(result.skills).toContain("React")
      expect(result.skills).toContain("Vue")
      expect(result.skills).toContain("Angular")
      expect(result.skills).toContain("Svelte")
    })
  })
})

