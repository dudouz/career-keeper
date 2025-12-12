/**
 * Analysis Context Types
 * Define who the user is and what they want to achieve
 */

export type Seniority = "junior" | "mid" | "senior" | "staff" | "principal" | "lead";

export type Role =
  | "backend"
  | "frontend"
  | "fullstack"
  | "devops"
  | "mobile"
  | "data"
  | "ml"
  | "security";

export type Objective =
  | "job_application" // Applying for a specific job
  | "promotion" // Seeking internal promotion
  | "year_review" // Annual performance review
  | "portfolio" // Building a portfolio
  | "general" // General analysis
  | "linkedin" // LinkedIn profile update
  | "resume_update" // Resume/CV update
  | "salary_negotiation"; // Preparing for salary negotiation

export interface AnalysisContext {
  seniority: Seniority;
  role: Role;
  objective: Objective;

  // Optional customizations
  targetJobTitle?: string; // e.g., "Senior Backend Engineer at Google"
  targetCompany?: string; // e.g., "Google", "Startup", "Enterprise"
  yearsOfExperience?: number;
  customInstructions?: string; // Free-form custom context
}

export const SENIORITY_LABELS: Record<Seniority, string> = {
  junior: "Junior Developer",
  mid: "Mid-Level Developer",
  senior: "Senior Developer",
  staff: "Staff Engineer",
  principal: "Principal Engineer",
  lead: "Tech Lead / Engineering Manager",
};

export const ROLE_LABELS: Record<Role, string> = {
  backend: "Backend Developer",
  frontend: "Frontend Developer",
  fullstack: "Full Stack Developer",
  devops: "DevOps Engineer",
  mobile: "Mobile Developer",
  data: "Data Engineer",
  ml: "ML Engineer",
  security: "Security Engineer",
};

export const OBJECTIVE_LABELS: Record<Objective, string> = {
  job_application: "Job Application",
  promotion: "Internal Promotion",
  year_review: "Annual Review",
  portfolio: "Portfolio Building",
  general: "General Analysis",
  linkedin: "LinkedIn Profile",
  resume_update: "Resume Update",
  salary_negotiation: "Salary Negotiation",
};

export const DEFAULT_CONTEXT: AnalysisContext = {
  seniority: "mid",
  role: "fullstack",
  objective: "general",
};
