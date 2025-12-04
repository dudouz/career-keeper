import { describe, it, expect } from "vitest"
import { parseTXT, extractSections, extractHeader, extractSummary } from "./parser"

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

  describe("extractHeader", () => {
    it("should extract email", () => {
      const text = `
        John Doe
        john.doe@example.com
        +1-555-1234
      `
      const result = extractHeader(text)

      expect(result.email).toBe("john.doe@example.com")
    })

    it("should extract name", () => {
      const text = `
        John Doe
        john.doe@example.com
      `
      const result = extractHeader(text)

      expect(result.name).toBeTruthy()
    })

    it("should extract GitHub URL", () => {
      const text = `
        John Doe
        john.doe@example.com
        github.com/johndoe
      `
      const result = extractHeader(text)

      expect(result.git).toContain("github.com/johndoe")
    })

    it("should extract LinkedIn URL", () => {
      const text = `
        John Doe
        john.doe@example.com
        linkedin.com/in/johndoe
      `
      const result = extractHeader(text)

      expect(result.linkedin).toContain("linkedin.com/in/johndoe")
    })
  })

  describe("extractSummary", () => {
    it("should extract summary section", () => {
      const text = `
        Summary
        Experienced software developer with 5 years of expertise

        Experience
        Senior Developer
      `
      const result = extractSummary(text)

      expect(result).toBeTruthy()
      expect(result).toContain("Experienced")
    })

    it("should return empty for no summary", () => {
      const text = `
        Experience
        Senior Developer
      `
      const result = extractSummary(text)

      expect(result).toBe("")
    })
  })

  describe("extractSections", () => {
    it("should extract work experience with dates", () => {
      const text = `
        Experience

        Senior Developer at Google
        2020 - 2023
        Led development of cloud platform

        Junior Developer at Meta
        2018 - 2020
        Built React components
      `
      const result = extractSections(text)

      expect(result.length).toBeGreaterThan(0)
      expect(result[0].position).toContain("Senior Developer")
      expect(result[0].company).toContain("Google")
    })

    it("should handle current positions", () => {
      const text = `
        Experience

        Senior Developer at Google
        2020 - Present
        Currently working on cloud platform
      `
      const result = extractSections(text)

      expect(result.length).toBe(1)
      expect(result[0].end).toBeUndefined()
    })

    it("should return empty array when no experience section", () => {
      const text = `
        Skills
        JavaScript, TypeScript
      `
      const result = extractSections(text)

      expect(result).toEqual([])
    })

    it("should extract sections from single-line format with bullet points", () => {
      const rawContent = "Eduardo Iotti - Software Engineer https://www.linkedin.com/in/eduardoiotti/ | https://github.com/dudouz Front End Engineer with six years of experience working in small and large teams to develop interactive, user-friendly, and feature-rich web applications. A self-motivated and lifelong learner familiar with modern web development and specialized in the React ecosystem (NextJS, Typescript, React Query, React Hook Form, Zod, Tailwind, Storybook, and Vitest) Work Experience > Thaloz Technologies – Senior Front-end Developer - November 2024 – Present | Uruguay ● Contributed as a contractor senior front-end engineer, allocated at Ledgebrook, a U.S.-based insurtech. ● Delivered a fully working app module for policies management, including a list page with Tanstack Data Table, State / Data fetching using React Query, and complex forms to validate policy information using Zod for schema validation."
      
      const result = extractSections(rawContent)

      expect(result.length).toBeGreaterThan(0)
      expect(result[0].company).toBe("Thaloz Technologies")
      expect(result[0].position).toBe("Senior Front-end Developer")
      expect(result[0].start).toBe("2024-11")
      expect(result[0].end).toBeUndefined()
      expect(result[0].description).toContain("Contributed as a contractor")
    })
  })

  describe("extractSummary with actual rawContent", () => {
    it("should extract summary from single-line format", () => {
      const rawContent = "Eduardo Iotti - Software Engineer https://www.linkedin.com/in/eduardoiotti/ | https://github.com/dudouz Front End Engineer with six years of experience working in small and large teams to develop interactive, user-friendly, and feature-rich web applications. A self-motivated and lifelong learner familiar with modern web development and specialized in the React ecosystem (NextJS, Typescript, React Query, React Hook Form, Zod, Tailwind, Storybook, and Vitest) Work Experience > Thaloz Technologies – Senior Front-end Developer - November 2024 – Present | Uruguay"
      
      const result = extractSummary(rawContent)

      expect(result).toBeTruthy()
      expect(result.length).toBeGreaterThan(50)
      expect(result).toContain("Front End Engineer with six years of experience")
      expect(result).toContain("React ecosystem")
    })
  })
})
