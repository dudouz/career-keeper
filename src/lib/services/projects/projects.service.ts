import { db } from "@/lib/db"
import { projects } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import type { Repository } from "@/lib/db/types"

export interface CreateProjectParams {
  userId: string
  repository: Repository
  projectName?: string
  notes?: string
}

export interface UpdateProjectParams {
  projectId: string
  userId: string
  projectName?: string
  notes?: string
}

export interface Project {
  id: string
  userId: string
  repositoryName: string
  repositoryUrl: string
  description: string | null
  language: string | null
  stars: string | null
  projectName: string | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
  isActive: boolean
}

/**
 * Create a new project from a repository
 */
export async function createProject(params: CreateProjectParams): Promise<Project> {
  const { userId, repository, projectName, notes } = params

  const [newProject] = await db
    .insert(projects)
    .values({
      userId,
      repositoryName: repository.name,
      repositoryUrl: repository.url,
      description: repository.description || null,
      language: repository.language || null,
      stars: repository.stars?.toString() || null,
      projectName: projectName || null,
      notes: notes || null,
      isActive: true,
    })
    .returning()

  if (!newProject) {
    throw new Error("Failed to create project")
  }

  return newProject as Project
}

/**
 * Get all active projects for a user
 */
export async function getUserProjects(userId: string): Promise<Project[]> {
  const userProjects = await db
    .select()
    .from(projects)
    .where(and(eq(projects.userId, userId), eq(projects.isActive, true)))
    .orderBy(projects.createdAt)

  return userProjects as Project[]
}

/**
 * Get a specific project by ID
 */
export async function getProjectById(projectId: string, userId: string): Promise<Project | null> {
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))

  return (project as Project) || null
}

/**
 * Update a project
 */
export async function updateProject(params: UpdateProjectParams): Promise<Project> {
  const { projectId, userId, projectName, notes } = params

  const updateData: Partial<typeof projects.$inferInsert> = {
    updatedAt: new Date(),
  }

  if (projectName !== undefined) {
    updateData.projectName = projectName || null
  }
  if (notes !== undefined) {
    updateData.notes = notes || null
  }

  const [updatedProject] = await db
    .update(projects)
    .set(updateData)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .returning()

  if (!updatedProject) {
    throw new Error("Project not found or not owned by user")
  }

  return updatedProject as Project
}

/**
 * Deactivate (soft delete) a project
 */
export async function deactivateProject(projectId: string, userId: string): Promise<void> {
  const result = await db
    .update(projects)
    .set({ isActive: false, updatedAt: new Date() })
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .returning()

  if (result.length === 0) {
    throw new Error("Project not found or not owned by user")
  }
}

/**
 * Create multiple projects from repositories
 */
export async function createProjectsFromRepositories(
  userId: string,
  repositories: Repository[],
  projectNames?: Record<string, string>
): Promise<Project[]> {
  const createdProjects: Project[] = []

  for (const repo of repositories) {
    const projectName = projectNames?.[repo.name] || null
    const project = await createProject({
      userId,
      repository: repo,
      projectName: projectName || undefined,
    })
    createdProjects.push(project)
  }

  return createdProjects
}

