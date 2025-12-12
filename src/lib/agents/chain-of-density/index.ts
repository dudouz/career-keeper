/**
 * Chain of Density Pipeline for GitHub Contribution Analysis
 *
 * A 3-step AI-powered analysis pipeline:
 * - Step 1: Extraction & Summary (What changed)
 * - Step 2: Pattern Recognition & Reasoning (How and Why)
 * - Step 3: Final Reporting (Presentation)
 */

// Main pipeline
export { runChainOfDensityPipeline } from "./pipeline";
export type { PipelineOptions, PipelineResult } from "./pipeline";

// Individual steps (for granular control)
export { runStep1Batch } from "./step1-extraction";
export { runStep2Batch, aggregateStep2Results } from "./step2-pattern-recognition";
export {
  runStep3Batch,
  generateConsolidatedReport,
} from "./step3-final-reporting";

// Types
export type {
  // Rich GitHub types
  PRAnalysis,
  CommitAnalysis,
  AnalysisResult,
  // Step outputs
  Step1Output,
  Step2Output,
  Step3Output,
  FileChange,
  TechStackItem,
  DesignPattern,
  // Reports
  ConsolidatedReport,
  // Input types
  ContributionItem,
  PipelineState,
} from "./types";

// Context types
export type {
  AnalysisContext,
  Seniority,
  Role,
  Objective,
} from "./context-types";

export {
  SENIORITY_LABELS,
  ROLE_LABELS,
  OBJECTIVE_LABELS,
  DEFAULT_CONTEXT,
} from "./context-types";

// Helpers
export {
  githubContributionsToItems,
  generateRAGContext,
  commitToContributionItem,
  prToContributionItem,
  createPRAnalysis,
  createCommitAnalysis,
  buildRichAnalysisResult,
} from "./helpers";
