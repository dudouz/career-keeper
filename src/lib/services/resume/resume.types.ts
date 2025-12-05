import type { ParsedResume } from "@/lib/resume/parser"

export interface UploadResumeParams {
  userId: string
  file: File
}

export interface ParseResumeParams {
  userId: string
  resumeId?: string
  file?: File
}

export interface DeleteResumeParams {
  userId: string
  resumeId: string
}

export interface ResumeWithSections {
  id: string
  userId: string
  title: string
  name: string | null
  email: string | null
  phone: string | null
  git: string | null
  linkedin: string | null
  website: string | null
  summary: string | null
  rawContent: string
  fileName: string
  fileType: string
  fileUrl: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  sections: Array<{
    id: string
    resumeId: string
    startDate: string
    endDate: string | null
    position: string
    company: string
    description: string
    displayOrder: number
    createdAt: Date
    updatedAt: Date
  }>
}

export type { ParsedResume }
