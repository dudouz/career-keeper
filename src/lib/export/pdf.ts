import jsPDF from "jspdf"
import type { ResumeContent } from "@/lib/db/types"
import { EXPORT } from "@/lib/constants"

interface ExportOptions {
  includeGeneratedDate?: boolean
  fontSize?: number
  lineHeight?: number
}

/**
 * Export resume content to PDF format
 */
export function exportResumeToPDF(
  content: ResumeContent,
  fileName: string = "resume.pdf",
  options: ExportOptions = {}
) {
  const { includeGeneratedDate = true, fontSize = EXPORT.PDF.FONT_SIZES.BODY, lineHeight = EXPORT.PDF.LINE_HEIGHT } = options

  // Create new PDF document (A4 size)
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = EXPORT.PDF.MARGIN
  const contentWidth = pageWidth - 2 * margin
  let currentY = margin

  // Helper to add new page if needed
  const checkPageBreak = (heightNeeded: number) => {
    if (currentY + heightNeeded > pageHeight - margin) {
      doc.addPage()
      currentY = margin
      return true
    }
    return false
  }

  // Helper to add section heading
  const addSectionHeading = (title: string) => {
    checkPageBreak(15)
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text(title.toUpperCase(), margin, currentY)
    currentY += 8

    // Add underline
    doc.setLineWidth(0.5)
    doc.line(margin, currentY, pageWidth - margin, currentY)
    currentY += 6
  }

  // Helper to add regular text
  const addText = (text: string, indent: number = 0) => {
    doc.setFontSize(fontSize)
    doc.setFont("helvetica", "normal")

    const lines = doc.splitTextToSize(text, contentWidth - indent)

    lines.forEach((line: string) => {
      checkPageBreak(lineHeight)
      doc.text(line, margin + indent, currentY)
      currentY += lineHeight
    })
  }

  // Helper to add bold text
  const addBoldText = (text: string, indent: number = 0) => {
    doc.setFontSize(fontSize)
    doc.setFont("helvetica", "bold")

    const lines = doc.splitTextToSize(text, contentWidth - indent)

    lines.forEach((line: string) => {
      checkPageBreak(lineHeight)
      doc.text(line, margin + indent, currentY)
      currentY += lineHeight
    })
  }

  // Add name/header if available
  if (content.summary) {
    doc.setFontSize(18)
    doc.setFont("helvetica", "bold")
    doc.text("Professional Resume", pageWidth / 2, currentY, { align: "center" })
    currentY += 12
  }

  // Add Summary
  if (content.summary) {
    addSectionHeading("Summary")
    addText(content.summary)
    currentY += 4
  }

  // Add Experience
  if (content.experience && content.experience.length > 0) {
    addSectionHeading("Experience")

    content.experience.forEach((exp) => {
      checkPageBreak(25)

      addBoldText(`${exp.position} at ${exp.company}`)
      doc.setFont("helvetica", "italic")
      doc.setFontSize(fontSize - 1)

      const dateRange = exp.endDate
        ? `${exp.startDate} - ${exp.endDate}`
        : `${exp.startDate} - Present`
      doc.text(dateRange, margin, currentY)
      currentY += lineHeight

      doc.setFont("helvetica", "normal")
      doc.setFontSize(fontSize)
      addText(exp.description, 5)

      if (exp.highlights && exp.highlights.length > 0) {
        exp.highlights.forEach((highlight) => {
          checkPageBreak(lineHeight)
          doc.text("•", margin + 5, currentY)
          const lines = doc.splitTextToSize(highlight, contentWidth - 15)
          lines.forEach((line: string, index: number) => {
            doc.text(line, margin + 10, currentY)
            if (index < lines.length - 1) {
              currentY += lineHeight
              checkPageBreak(lineHeight)
            }
          })
          currentY += lineHeight
        })
      }

      currentY += 4
    })
  }

  // Add Projects
  if (content.projects && content.projects.length > 0) {
    addSectionHeading("Projects")

    content.projects.forEach((project) => {
      checkPageBreak(20)

      addBoldText(project.name)
      addText(project.description, 5)

      if (project.technologies && project.technologies.length > 0) {
        doc.setFont("helvetica", "italic")
        doc.setFontSize(fontSize - 1)
        doc.text(`Technologies: ${project.technologies.join(", ")}`, margin + 5, currentY)
        currentY += lineHeight
      }

      if (project.highlights && project.highlights.length > 0) {
        project.highlights.forEach((highlight) => {
          checkPageBreak(lineHeight)
          doc.setFont("helvetica", "normal")
          doc.setFontSize(fontSize)
          doc.text("•", margin + 5, currentY)
          const lines = doc.splitTextToSize(highlight, contentWidth - 15)
          lines.forEach((line: string, index: number) => {
            doc.text(line, margin + 10, currentY)
            if (index < lines.length - 1) {
              currentY += lineHeight
              checkPageBreak(lineHeight)
            }
          })
          currentY += lineHeight
        })
      }

      currentY += 4
    })
  }

  // Add Skills
  if (content.skills && content.skills.length > 0) {
    addSectionHeading("Skills")
    const skillsText = content.skills.join(" • ")
    addText(skillsText)
    currentY += 4
  }

  // Add Education
  if (content.education && content.education.length > 0) {
    addSectionHeading("Education")

    content.education.forEach((edu) => {
      checkPageBreak(15)

      addBoldText(edu.institution)

      const degreeText = edu.field ? `${edu.degree} in ${edu.field}` : edu.degree
      addText(degreeText, 5)

      if (edu.endDate) {
        doc.setFont("helvetica", "italic")
        doc.setFontSize(fontSize - 1)
        const dateRange = edu.startDate ? `${edu.startDate} - ${edu.endDate}` : edu.endDate
        doc.text(dateRange, margin + 5, currentY)
        currentY += lineHeight
      }

      if (edu.gpa) {
        doc.setFont("helvetica", "normal")
        doc.setFontSize(fontSize)
        doc.text(`GPA: ${edu.gpa}`, margin + 5, currentY)
        currentY += lineHeight
      }

      currentY += 4
    })
  }

  // Add Certifications
  if (content.certifications && content.certifications.length > 0) {
    addSectionHeading("Certifications")
    content.certifications.forEach((cert) => {
      checkPageBreak(lineHeight)
      doc.text("•", margin, currentY)
      addText(cert, 5)
    })
    currentY += 4
  }

  // Add Awards
  if (content.awards && content.awards.length > 0) {
    addSectionHeading("Awards")
    content.awards.forEach((award) => {
      checkPageBreak(lineHeight)
      doc.text("•", margin, currentY)
      addText(award, 5)
    })
    currentY += 4
  }

  // Add Custom Sections
  if (content.customSections && content.customSections.length > 0) {
    content.customSections.forEach((section) => {
      addSectionHeading(section.title)
      addText(section.content)
      currentY += 4
    })
  }

  // Add generation date footer
  if (includeGeneratedDate) {
    const totalPages = doc.getNumberOfPages()

    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setFont("helvetica", "italic")
      doc.setTextColor(128, 128, 128)

      const footerText = `Generated on ${new Date().toLocaleDateString()}`
      const pageText = `Page ${i} of ${totalPages}`

      doc.text(footerText, margin, pageHeight - 10)
      doc.text(pageText, pageWidth - margin, pageHeight - 10, { align: "right" })
    }
  }

  // Download the PDF
  doc.save(fileName)
}
