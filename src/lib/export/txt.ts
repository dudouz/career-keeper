import type { ResumeContent } from "@/lib/db/types"

interface ExportOptions {
  includeGeneratedDate?: boolean
  columnWidth?: number
}

/**
 * Export resume content to plain text format
 */
export function exportResumeToTXT(
  content: ResumeContent,
  fileName: string = "resume.txt",
  options: ExportOptions = {}
) {
  const { includeGeneratedDate = true, columnWidth = 80 } = options

  let text = ""

  // Helper to add section heading
  const addSectionHeading = (title: string) => {
    text += "\n"
    text += title.toUpperCase() + "\n"
    text += "=".repeat(title.length) + "\n\n"
  }

  // Helper to add separator
  const addSeparator = () => {
    text += "\n" + "-".repeat(columnWidth) + "\n\n"
  }

  // Helper to wrap text
  const wrapText = (str: string, width: number, indent: number = 0): string => {
    const indentStr = " ".repeat(indent)
    const words = str.split(" ")
    const lines: string[] = []
    let currentLine = indentStr

    words.forEach((word) => {
      if ((currentLine + word).length > width) {
        lines.push(currentLine.trimEnd())
        currentLine = indentStr + word + " "
      } else {
        currentLine += word + " "
      }
    })

    if (currentLine.trim()) {
      lines.push(currentLine.trimEnd())
    }

    return lines.join("\n")
  }

  // Add header
  text += "=".repeat(columnWidth) + "\n"
  text += "PROFESSIONAL RESUME".padStart((columnWidth + 18) / 2) + "\n"
  text += "=".repeat(columnWidth) + "\n"

  // Add Summary
  if (content.summary) {
    addSectionHeading("Summary")
    text += wrapText(content.summary, columnWidth) + "\n"
  }

  // Add Experience
  if (content.experience && content.experience.length > 0) {
    addSectionHeading("Experience")

    const experiences = content.experience
    experiences.forEach((exp, index) => {
      if (index > 0) text += "\n"

      text += `${exp.position} at ${exp.company}\n`

      const dateRange = exp.endDate
        ? `${exp.startDate} - ${exp.endDate}`
        : `${exp.startDate} - Present`
      text += dateRange + "\n\n"

      text += wrapText(exp.description, columnWidth, 2) + "\n"

      if (exp.highlights && exp.highlights.length > 0) {
        text += "\n"
        exp.highlights.forEach((highlight) => {
          text += "  • " + wrapText(highlight, columnWidth - 4, 4).substring(4) + "\n"
        })
      }

      if (index < experiences.length - 1) {
        text += "\n"
      }
    })
  }

  // Add Projects
  if (content.projects && content.projects.length > 0) {
    addSectionHeading("Projects")

    const projects = content.projects
    projects.forEach((project, index) => {
      if (index > 0) text += "\n"

      text += `${project.name}\n`
      text += wrapText(project.description, columnWidth, 2) + "\n"

      if (project.technologies && project.technologies.length > 0) {
        text += `\n  Technologies: ${project.technologies.join(", ")}\n`
      }

      if (project.url) {
        text += `  URL: ${project.url}\n`
      }

      if (project.highlights && project.highlights.length > 0) {
        text += "\n"
        project.highlights.forEach((highlight) => {
          text += "  • " + wrapText(highlight, columnWidth - 4, 4).substring(4) + "\n"
        })
      }

      if (index < projects.length - 1) {
        text += "\n"
      }
    })
  }

  // Add Skills
  if (content.skills && content.skills.length > 0) {
    addSectionHeading("Skills")
    text += wrapText(content.skills.join(" • "), columnWidth) + "\n"
  }

  // Add Education
  if (content.education && content.education.length > 0) {
    addSectionHeading("Education")

    const education = content.education
    education.forEach((edu, index) => {
      if (index > 0) text += "\n"

      text += `${edu.institution}\n`

      const degreeText = edu.field
        ? `${edu.degree} in ${edu.field}`
        : edu.degree
      text += `  ${degreeText}\n`

      if (edu.endDate) {
        const dateRange = edu.startDate
          ? `${edu.startDate} - ${edu.endDate}`
          : edu.endDate
        text += `  ${dateRange}\n`
      }

      if (edu.gpa) {
        text += `  GPA: ${edu.gpa}\n`
      }

      if (index < education.length - 1) {
        text += "\n"
      }
    })
  }

  // Add Certifications
  if (content.certifications && content.certifications.length > 0) {
    addSectionHeading("Certifications")
    content.certifications.forEach((cert) => {
      text += `  • ${cert}\n`
    })
  }

  // Add Awards
  if (content.awards && content.awards.length > 0) {
    addSectionHeading("Awards")
    content.awards.forEach((award) => {
      text += `  • ${award}\n`
    })
  }

  // Add Custom Sections
  if (content.customSections && content.customSections.length > 0) {
    content.customSections.forEach((section) => {
      addSectionHeading(section.title)
      text += wrapText(section.content, columnWidth) + "\n"
    })
  }

  // Add footer
  if (includeGeneratedDate) {
    addSeparator()
    text += `Generated on ${new Date().toLocaleString()}\n`
  }

  // Create and download the file
  const blob = new Blob([text], { type: "text/plain" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
}

