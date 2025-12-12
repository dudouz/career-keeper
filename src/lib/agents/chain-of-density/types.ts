import type { GitHubContributionData } from "@/lib/db/types";

// Rich GitHub-specific analysis types (from original types.ts)
export interface PRAnalysis {
  prNumber: number;
  title: string;
  summary: string;
  technologies: string[];
  patterns: string[];
  complexity: "low" | "medium" | "high";
  impact: string;
  filesChanged?: number;
  additions?: number;
  deletions?: number;
}

export interface CommitAnalysis {
  sha: string;
  message: string;
  summary: string;
  technologies: string[];
  patterns: string[];
  filesChanged: number;
  impact: string;
  additions?: number;
  deletions?: number;
}

// Step 1: Extraction & Summary Types
export interface FileChange {
  file_path: string;
  change_type: "CREATE" | "UPDATE" | "DELETE" | "REFACTOR";
  technical_description: string;
}

export interface Step1Output {
  summary_high_level: string;
  changes: FileChange[];
  new_dependencies: string[];
  rag_utilization: string;

  // Rich analysis data (mixed approach)
  richAnalysis?: PRAnalysis | CommitAnalysis;
}

// Step 2: Pattern Recognition & Reasoning Types
export interface TechStackItem {
  name: string;
  purpose: string;
}

export interface DesignPattern {
  name: string;
  confidence: "High" | "Medium" | "Low";
  justification: string;
}

export interface Step2Output {
  tech_stack_utilized: TechStackItem[];
  design_patterns: DesignPattern[];
  key_decisions: string[];
  architectural_impact: string;
}

// Step 3: Final Reporting Types
export interface Step3Output {
  markdownReport: string;
  contributionMetadata: {
    type: "pr" | "commit";
    identifier: string; // PR number or commit SHA
    title?: string;
    author?: string;
    date?: string;
  };
}

export interface ConsolidatedReport {
  overallSummary: string;
  individualReports: Step3Output[];
  aggregatedInsights: {
    totalContributions: number;
    topTechnologies: Array<{ name: string; count: number }>;
    topPatterns: Array<{ name: string; count: number }>;
    keyAchievements: string[];
  };

  // Rich analysis results (mixed approach)
  richAnalysisResult: AnalysisResult;
}

// Consolidated analysis result with rich GitHub data
export interface AnalysisResult {
  prAnalyses: PRAnalysis[];
  commitAnalyses: CommitAnalysis[];
  overallSummary: string;
  keyTechnologies: string[];
  keyPatterns: string[];
  recommendations: string[];

  // Additional metadata
  metadata?: {
    totalPRs: number;
    totalCommits: number;
    totalFilesChanged: number;
    totalAdditions: number;
    totalDeletions: number;
    complexityDistribution: {
      low: number;
      medium: number;
      high: number;
    };
  };
}

// Pipeline State
export interface PipelineState {
  // Input
  contributions: GitHubContributionData;
  ragContext?: string;

  // Step 1 outputs
  step1Results: Step1Output[];

  // Step 2 outputs
  step2Results: Step2Output[];

  // Step 3 output
  finalReport?: Step3Output;

  // Metadata
  currentStep: "step1" | "step2" | "step3" | "done";
  processedCount: number;
  totalToProcess: number;
  error?: string;
}

// Individual contribution item for processing
export interface ContributionItem {
  type: "pr" | "commit";
  commitMessages: string;
  rawDiff: string;
  metadata: {
    sha?: string;
    prNumber?: number;
    title?: string;
    author?: string;
    date?: string;
  };
}
