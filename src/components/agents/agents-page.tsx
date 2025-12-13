"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  useAnalyzeContributionsWithAgentMutation,
  useGitHubStatusQuery,
  useOpenAIKeyStatusQuery,
  useActiveSnapshotQuery,
  useGitHubContributionsQuery,
  useSnapshotByIdQuery,
  queryKeys,
} from "@/lib/api/queries"
import { RepositorySelector } from "@/components/projects/repository-selector"
import type { GitHubContributionData } from "@/lib/db/types"
import {
  OBJECTIVE_LABELS,
  ROLE_LABELS,
  SENIORITY_LABELS,
  type Objective,
  type Role,
  type Seniority,
} from "@/lib/agents/chain-of-density/context-types"
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  Sparkles,
  Copy,
  Download,
} from "lucide-react"
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useQueryClient } from "@tanstack/react-query"
import { MarkdownRenderer } from "./markdown-renderer"

const analysisFormSchema = z
  .object({
    // Period filters
    periodType: z.enum(["all", "lastNDays", "dateRange"]),
    lastNDays: z.number().min(1).max(365).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    // Contribution type filters
    contributionTypes: z.array(z.enum(["pr", "commit", "issue", "release"])).min(1),
    // Context
    seniority: z.enum(["junior", "mid", "senior", "staff", "principal", "lead"]),
    role: z.enum(["backend", "frontend", "fullstack", "devops", "mobile", "data", "ml", "security"]),
    objective: z.enum([
      "job_application",
      "promotion",
      "year_review",
      "portfolio",
      "general",
      "linkedin",
      "resume_update",
      "salary_negotiation",
    ]),
    targetJobTitle: z.string().optional(),
    targetCompany: z.string().optional(),
    yearsOfExperience: z.number().min(0).max(50).optional(),
    customInstructions: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.periodType === "lastNDays") {
        return data.lastNDays !== undefined && data.lastNDays > 0
      }
      if (data.periodType === "dateRange") {
        return data.startDate !== undefined && data.endDate !== undefined
      }
      return true
    },
    {
      message: "Please fill in the required period fields",
      path: ["periodType"],
    }
  )

type AnalysisFormData = z.infer<typeof analysisFormSchema>

interface AgentsPageProps {
  snapshotId?: string // Optional snapshot ID from URL params
}

export function AgentsPage({ snapshotId: urlSnapshotId }: AgentsPageProps = {}) {
  const queryClient = useQueryClient()
  const { data: githubStatus } = useGitHubStatusQuery()
  const { data: openaiKeyStatus } = useOpenAIKeyStatusQuery()
  
  // Use snapshot from URL if provided, otherwise use active snapshot
  const { data: urlSnapshotData, isLoading: loadingUrlSnapshot } = useSnapshotByIdQuery(
    urlSnapshotId || "",
    { enabled: !!urlSnapshotId }
  )
  const { data: activeSnapshotData, isLoading: loadingActiveSnapshot } = useActiveSnapshotQuery({
    enabled: !urlSnapshotId,
  })
  
  const snapshotData = urlSnapshotId ? urlSnapshotData : activeSnapshotData
  const loadingSnapshot = urlSnapshotId ? loadingUrlSnapshot : loadingActiveSnapshot
  const analyzeMutation = useAnalyzeContributionsWithAgentMutation()

  const [progress, setProgress] = useState<{
    step: "step1" | "step2" | "step3" | "consolidated" | null;
    current: number;
    total: number;
    message: string;
  } | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const [results, setResults] = useState<{
    consolidatedReport: {
      overallSummary: string
      individualReports: Array<{
        markdownReport: string
        contributionMetadata: {
          type: "pr" | "commit"
          identifier: string
          title?: string
          author?: string
          date?: string
        }
      }>
      aggregatedInsights: {
        totalContributions: number
        topTechnologies: Array<{ name: string; count: number }>
        topPatterns: Array<{ name: string; count: number }>
        keyAchievements: string[]
      }
    }
    metadata: {
      totalContributions: number
      processedContributions: number
      totalDurationMs: number
    }
  } | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AnalysisFormData>({
    resolver: zodResolver(analysisFormSchema),
    defaultValues: {
      periodType: "all",
      contributionTypes: ["pr", "commit"],
      seniority: "mid",
      role: "fullstack",
      objective: "general",
    },
  })

  // Track if form is populated from snapshot
  const [isFormPopulatedFromSnapshot, setIsFormPopulatedFromSnapshot] = useState(false)
  
  // Repository selection state
  const [selectedRepositories, setSelectedRepositories] = useState<string[]>([])
  
  // Fetch GitHub contributions to get repositories (only if not in snapshot)
  const { data: contributionsData } = useGitHubContributionsQuery({
    enabled: !!githubStatus?.connected && !snapshotData?.data?.githubContributionsData,
  })
  
  // Get repositories from GitHub scan data (either from snapshot or from contributions query)
  // The repositories are already available from the initial GitHub scan
  // Note: In snapshot, githubContributionsData is wrapped with metadata, so we need to access .data
  const snapshotContributionsData = snapshotData?.data?.githubContributionsData as any
  const rawContributionsData = snapshotContributionsData?.data || snapshotContributionsData || contributionsData?.contributions
  const repositories: Array<{ name: string; description?: string; url: string; language?: string; stars?: number }> = 
    rawContributionsData?.repositories || []
  
  // Store snapshot for reference in form
  const snapshot = snapshotData?.data as any

  // Load existing analysis from active snapshot if available and populate form with resume data
  useEffect(() => {
    if (!loadingSnapshot && snapshotData?.data) {
      const snapshot = snapshotData.data as any
      const githubAnalysis = snapshot.githubAnalysis as any
      
      // Populate form with resume data from snapshot
      let hasData = false
      if (snapshot.seniority) {
        setValue("seniority", snapshot.seniority as Seniority)
        hasData = true
      }
      if (snapshot.focus) {
        // Map focus to role enum
        const focusToRole: Record<string, Role> = {
          backend: "backend",
          frontend: "frontend",
          fullstack: "fullstack",
          devops: "devops",
        }
        const role = focusToRole[snapshot.focus.toLowerCase()]
        if (role) {
          setValue("role", role)
          hasData = true
        }
      }
      if (snapshot.yearsOfExperience) {
        setValue("yearsOfExperience", snapshot.yearsOfExperience)
        hasData = true
      }
      
      // Set default values for required fields
      setValue("periodType", "all")
      setValue("contributionTypes", ["pr", "commit"])
      
      if (hasData) {
        setIsFormPopulatedFromSnapshot(true)
      }
      
      // Load existing analysis if available
      console.log("[AgentsPage] Checking for githubAnalysis:", {
        hasGithubAnalysis: !!githubAnalysis,
        githubAnalysisType: typeof githubAnalysis,
        githubAnalysisKeys: githubAnalysis ? Object.keys(githubAnalysis as any) : [],
        githubAnalysis: githubAnalysis,
      })
      
      if (githubAnalysis) {
        // Handle both formats: direct object or wrapped object
        let consolidatedReport = null
        let metadata = null
        
        if (typeof githubAnalysis === 'object' && githubAnalysis !== null) {
          const analysis = githubAnalysis as any
          // Check if it's already in the correct format
          if (analysis.consolidatedReport) {
            consolidatedReport = analysis.consolidatedReport
            metadata = analysis.metadata
          } else if (analysis.overallSummary || analysis.aggregatedInsights) {
            // It might be the consolidatedReport directly
            consolidatedReport = analysis
            metadata = { totalContributions: 0, processedContributions: 0, totalDurationMs: 0 }
          }
        }
        
        if (consolidatedReport) {
          console.log("[AgentsPage] Loading analysis from snapshot:", { consolidatedReport, metadata })
          setResults({
            consolidatedReport,
            metadata: metadata || {
              totalContributions: consolidatedReport?.aggregatedInsights?.totalContributions || 0,
              processedContributions: consolidatedReport?.aggregatedInsights?.totalContributions || 0,
              totalDurationMs: 0,
            },
          })
        } else {
          console.warn("[AgentsPage] githubAnalysis exists but format is unexpected:", githubAnalysis)
        }
      }
    }
  }, [snapshotData, loadingSnapshot, setValue])

  const periodType = watch("periodType")
  const isConnected = githubStatus?.connected || false
  const hasOpenAIKey = openaiKeyStatus?.hasKey || false

  const onSubmit = async (data: AnalysisFormData) => {
    console.log("[AgentsPage] Form submitted with data:", data)
    setIsStreaming(true);
    setProgress(null);
    setResults(null);

    // Use snapshot-specific route if we have an active snapshot
    const snapshotId = snapshotData?.data?.id as string | undefined
    const apiRoute = snapshotId 
      ? `/api/snapshots/${snapshotId}/analyze-stream`
      : "/api/agents/analyze-contributions-stream"

    try {
      const response = await fetch(apiRoute, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(snapshotId ? {} : { contributions: rawContributionsData }), // Only send contributions if not using snapshot route
          options: {
            maxCommits: 20,
            maxPRs: 10,
            includeRAGContext: true,
            contributionTypes: data.contributionTypes,
            repositoryNames: selectedRepositories.length > 0 ? selectedRepositories : undefined,
            ...(data.periodType === "lastNDays" && data.lastNDays
              ? { lastNDays: data.lastNDays }
              : {}),
            ...(data.periodType === "dateRange" && data.startDate && data.endDate
              ? { startDate: data.startDate, endDate: data.endDate }
              : {}),
            context: {
              seniority: data.seniority,
              role: data.role,
              objective: data.objective,
              ...(data.targetJobTitle ? { targetJobTitle: data.targetJobTitle } : {}),
              ...(data.targetCompany ? { targetCompany: data.targetCompany } : {}),
              ...(data.yearsOfExperience ? { yearsOfExperience: data.yearsOfExperience } : {}),
              ...(data.customInstructions ? { customInstructions: data.customInstructions } : {}),
            },
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to start analysis");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("Stream not available");
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === "progress") {
                setProgress({
                  step: data.step,
                  current: data.current,
                  total: data.total,
                  message: data.message,
                });
              } else if (data.type === "complete") {
                const analysisResult = {
                  consolidatedReport: data.data.consolidatedReport,
                  metadata: data.metadata,
                };
                setResults(analysisResult);
                setIsStreaming(false);
                
                // Analysis is automatically saved to snapshot when using snapshot route
                // Only need to invalidate queries to refresh UI
                if (snapshotId) {
                  console.log("[AgentsPage] Analysis saved to snapshot automatically via API");
                  queryClient.invalidateQueries({ queryKey: queryKeys.snapshots.active() });
                  queryClient.invalidateQueries({ queryKey: queryKeys.snapshots.detail(snapshotId) });
                }
              } else if (data.type === "error") {
                throw new Error(data.error);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error("Streaming error:", error);
      setIsStreaming(false);
      // Fallback to regular mutation
          const options: Parameters<typeof analyzeMutation.mutate>[0] = {
            maxCommits: 20,
            maxPRs: 10,
            includeRAGContext: true,
            contributionTypes: data.contributionTypes,
            repositoryNames: selectedRepositories.length > 0 ? selectedRepositories : undefined,
            ...(data.periodType === "lastNDays" && data.lastNDays
              ? { lastNDays: data.lastNDays }
              : {}),
            ...(data.periodType === "dateRange" && data.startDate && data.endDate
              ? { startDate: data.startDate, endDate: data.endDate }
              : {}),
            context: {
          seniority: data.seniority,
          role: data.role,
          objective: data.objective,
          ...(data.targetJobTitle ? { targetJobTitle: data.targetJobTitle } : {}),
          ...(data.targetCompany ? { targetCompany: data.targetCompany } : {}),
          ...(data.yearsOfExperience ? { yearsOfExperience: data.yearsOfExperience } : {}),
          ...(data.customInstructions ? { customInstructions: data.customInstructions } : {}),
        },
      };

      analyzeMutation.mutate(options, {
        onSuccess: (response) => {
          if (response.success && response.data) {
            const analysisResult = {
              consolidatedReport: response.data.consolidatedReport,
              metadata: response.metadata,
            };
            setResults(analysisResult);
            
            // Analysis is automatically saved to snapshot when using snapshot route
            // Only need to invalidate queries to refresh UI
            if (snapshotId) {
              console.log("[AgentsPage] Analysis saved to snapshot automatically via API (fallback)");
              queryClient.invalidateQueries({ queryKey: queryKeys.snapshots.active() });
              queryClient.invalidateQueries({ queryKey: queryKeys.snapshots.detail(snapshotId) });
            }
          }
        },
      });
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const downloadMarkdown = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">AI Contribution Analysis</h1>
          <p className="text-muted-foreground">
            Analyze your GitHub contributions with AI-powered insights
          </p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please connect your GitHub account first in the{" "}
            <a href="/dashboard/github" className="underline">
              GitHub Scanner
            </a>{" "}
            page.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!hasOpenAIKey) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">AI Contribution Analysis</h1>
          <p className="text-muted-foreground">
            Analyze your GitHub contributions with AI-powered insights
          </p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please configure your OpenAI API key in{" "}
            <a href="/dashboard/settings" className="underline">
              Settings
            </a>{" "}
            to use this feature.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Contribution Analysis</h1>
        <p className="text-muted-foreground">
          Analyze your GitHub contributions with AI-powered insights using Chain of Density pipeline
        </p>
      </div>

      {/* Progress Display */}
      {(isStreaming || progress) && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="font-medium">
                    {progress?.message || "Starting analysis..."}
                  </span>
                </div>
                {progress && (
                  <span className="text-sm text-muted-foreground">
                    {progress.current}/{progress.total}
                  </span>
                )}
              </div>
              {progress && progress.total > 0 && (
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {analyzeMutation.isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {analyzeMutation.error instanceof Error
              ? analyzeMutation.error.message
              : "Failed to analyze contributions"}
          </AlertDescription>
        </Alert>
      )}

      {/* Repository Selector - Show before form if repositories are available from GitHub scan */}
      {repositories.length > 0 && !results && (
        <RepositorySelector
          repositories={repositories}
          selectedRepositories={selectedRepositories}
          onSelectionChange={setSelectedRepositories}
        />
      )}
      
      {repositories.length === 0 && isConnected && !loadingSnapshot && !results && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No repositories found. {snapshotContributionsData ? "The snapshot may not have repository data." : "Please scan your GitHub contributions first to load repositories."}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Debug info - remove in production */}
      {process.env.NODE_ENV === "development" && (
        <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
          Debug: repositories={repositories.length}, hasSnapshotData={!!snapshotContributionsData}, hasRawData={!!rawContributionsData}, snapshotKeys={snapshotContributionsData ? Object.keys(snapshotContributionsData).join(", ") : "none"}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Stats Cards or Form Section */}
        {isFormPopulatedFromSnapshot && snapshot ? (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <CardTitle>Analysis Context</CardTitle>
              </div>
              <CardDescription>
                Using data extracted from your resume
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {snapshot.seniority && (
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Seniority</p>
                          <p className="text-lg font-semibold capitalize">{snapshot.seniority}</p>
                        </div>
                        <Badge variant="outline">From Resume</Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {snapshot.focus && (
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Role</p>
                          <p className="text-lg font-semibold capitalize">{snapshot.focus}</p>
                        </div>
                        <Badge variant="outline">From Resume</Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {snapshot.yearsOfExperience && (
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Experience</p>
                          <p className="text-lg font-semibold">{snapshot.yearsOfExperience} years</p>
                        </div>
                        <Badge variant="outline">From Resume</Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
              
              <form 
                onSubmit={handleSubmit(
                  onSubmit,
                  (errors) => {
                    console.error("[AgentsPage] Form validation errors:", errors)
                    alert(`Form validation failed: ${JSON.stringify(errors)}`)
                  }
                )} 
                className="space-y-4 mt-4"
              >
                <div>
                  <Label>Objective</Label>
                  <Select
                    value={watch("objective")}
                    onValueChange={(value) => setValue("objective", value as Objective)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(OBJECTIVE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {watch("objective") === "job_application" && (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="targetJobTitle">Target Job Title (Optional)</Label>
                      <Input
                        id="targetJobTitle"
                        placeholder="Senior Backend Engineer at Google"
                        {...register("targetJobTitle")}
                      />
                    </div>
                    <div>
                      <Label htmlFor="targetCompany">Target Company (Optional)</Label>
                      <Input
                        id="targetCompany"
                        placeholder="Google"
                        {...register("targetCompany")}
                      />
                    </div>
                  </div>
                )}
                <div>
                  <Label htmlFor="customInstructions">Custom Instructions (Optional)</Label>
                  <Textarea
                    id="customInstructions"
                    placeholder="Emphasize distributed systems, scalability, and high-traffic experience..."
                    rows={3}
                    {...register("customInstructions")}
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={analyzeMutation.isPending || isStreaming} 
                  className="w-full"
                  onClick={(e) => {
                    console.log("[AgentsPage] Button clicked, form values:", {
                      periodType: watch("periodType"),
                      contributionTypes: watch("contributionTypes"),
                      seniority: watch("seniority"),
                      role: watch("role"),
                      objective: watch("objective"),
                    })
                  }}
                >
                  {(analyzeMutation.isPending || isStreaming) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {(analyzeMutation.isPending || isStreaming) ? "Analyzing..." : "Generate New Analysis"}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <CardTitle>Analysis Configuration</CardTitle>
              </div>
              <CardDescription>
                Configure the analysis parameters and context for personalized reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Period Filter */}
              <div className="space-y-4">
                <Label>Time Period</Label>
                <Select
                  value={periodType}
                  onValueChange={(value) => setValue("periodType", value as AnalysisFormData["periodType"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Contributions</SelectItem>
                    <SelectItem value="lastNDays">Last N Days</SelectItem>
                    <SelectItem value="dateRange">Date Range</SelectItem>
                  </SelectContent>
                </Select>

                {periodType === "lastNDays" && (
                  <div>
                    <Label htmlFor="lastNDays">Number of Days</Label>
                    <Input
                      id="lastNDays"
                      type="number"
                      min={1}
                      max={365}
                      placeholder="30"
                      {...register("lastNDays", { valueAsNumber: true })}
                    />
                    {errors.lastNDays && (
                      <p className="mt-1 text-sm text-destructive">{errors.lastNDays.message}</p>
                    )}
                  </div>
                )}

                {periodType === "dateRange" && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        {...register("startDate")}
                      />
                      {errors.startDate && (
                        <p className="mt-1 text-sm text-destructive">{errors.startDate.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        {...register("endDate")}
                      />
                      {errors.endDate && (
                        <p className="mt-1 text-sm text-destructive">{errors.endDate.message}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Contribution Types */}
              <div className="space-y-4">
                <Label>Contribution Types</Label>
                <div className="flex flex-wrap gap-2">
                  {(["pr", "commit", "issue", "release"] as const).map((type) => {
                    const currentTypes = watch("contributionTypes") || [];
                    const isSelected = currentTypes.includes(type);
                    return (
                      <Button
                        key={type}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          if (isSelected) {
                            const newTypes = currentTypes.filter((t) => t !== type);
                            setValue("contributionTypes", newTypes.length > 0 ? newTypes : ["pr"]);
                          } else {
                            setValue("contributionTypes", [...currentTypes, type]);
                          }
                        }}
                      >
                        {type.toUpperCase()}
                      </Button>
                    );
                  })}
                </div>
                {errors.contributionTypes && (
                  <p className="text-sm text-destructive">{errors.contributionTypes.message}</p>
                )}
              </div>

              {/* Context Section */}
              <div className="space-y-4">
                <Label>Analysis Context</Label>

                <div>
                  <Label htmlFor="seniority">
                    Seniority Level
                    {isFormPopulatedFromSnapshot && snapshot?.seniority && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        From Resume
                      </Badge>
                    )}
                  </Label>
                  <Select
                    value={watch("seniority")}
                    onValueChange={(value) => setValue("seniority", value as Seniority)}
                    disabled={isFormPopulatedFromSnapshot && !!snapshot?.seniority}
                  >
                    <SelectTrigger id="seniority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(SENIORITY_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="role">
                    Role / Specialization
                    {isFormPopulatedFromSnapshot && snapshot?.focus && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        From Resume
                      </Badge>
                    )}
                  </Label>
                  <Select
                    value={watch("role")}
                    onValueChange={(value) => setValue("role", value as Role)}
                    disabled={isFormPopulatedFromSnapshot && !!snapshot?.focus}
                  >
                    <SelectTrigger id="role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ROLE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="objective">Objective</Label>
                  <Select
                    value={watch("objective")}
                    onValueChange={(value) => setValue("objective", value as Objective)}
                  >
                    <SelectTrigger id="objective">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(OBJECTIVE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {watch("objective") === "job_application" && (
                  <>
                    <div>
                      <Label htmlFor="targetJobTitle">Target Job Title (Optional)</Label>
                      <Input
                        id="targetJobTitle"
                        placeholder="Senior Backend Engineer at Google"
                        {...register("targetJobTitle")}
                      />
                    </div>
                    <div>
                      <Label htmlFor="targetCompany">Target Company (Optional)</Label>
                      <Input
                        id="targetCompany"
                        placeholder="Google"
                        {...register("targetCompany")}
                      />
                    </div>
                  </>
                )}

                <div>
                  <Label htmlFor="yearsOfExperience">
                    Years of Experience (Optional)
                    {isFormPopulatedFromSnapshot && snapshot?.yearsOfExperience && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        From Resume
                      </Badge>
                    )}
                  </Label>
                  <Input
                    id="yearsOfExperience"
                    type="number"
                    min={0}
                    max={50}
                    placeholder="5"
                    disabled={isFormPopulatedFromSnapshot && !!snapshot?.yearsOfExperience}
                    {...register("yearsOfExperience", { valueAsNumber: true })}
                  />
                </div>

                <div>
                  <Label htmlFor="customInstructions">Custom Instructions (Optional)</Label>
                  <Textarea
                    id="customInstructions"
                    placeholder="Emphasize distributed systems, scalability, and high-traffic experience..."
                    rows={3}
                    {...register("customInstructions")}
                  />
                </div>
              </div>

              <Button type="submit" disabled={analyzeMutation.isPending || isStreaming} className="w-full">
                {(analyzeMutation.isPending || isStreaming) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {(analyzeMutation.isPending || isStreaming) ? "Analyzing..." : "Analyze Contributions"}
              </Button>
            </form>
          </CardContent>
        </Card>
        )}

        {/* Results Section */}
        <div className="space-y-6">
          {/* Progress Display */}
          {(isStreaming || progress) && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="font-medium">
                        {progress?.message || "Starting analysis..."}
                      </span>
                    </div>
                    {progress && (
                      <span className="text-sm text-muted-foreground">
                        {progress.current}/{progress.total}
                      </span>
                    )}
                  </div>
                  {progress && progress.total > 0 && (
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(progress.current / progress.total) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {analyzeMutation.isPending && !isStreaming && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground">
                  Analyzing your contributions... This may take 1-2 minutes.
                </p>
              </CardContent>
            </Card>
          )}

          {results && (
            <>
              {/* Overall Summary */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <CardTitle>Overall Summary</CardTitle>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(results.consolidatedReport.overallSummary)}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          downloadMarkdown(
                            results.consolidatedReport.overallSummary,
                            "overall-summary.md"
                          )
                        }
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  </div>
                  <CardDescription>
                    {results.metadata.processedContributions} contributions analyzed in{" "}
                    {(results.metadata.totalDurationMs / 1000).toFixed(1)}s
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MarkdownRenderer content={results.consolidatedReport.overallSummary} />
                </CardContent>
              </Card>

              {/* Aggregated Insights */}
              <Card>
                <CardHeader>
                  <CardTitle>Key Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-semibold">Top Technologies</Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {results.consolidatedReport.aggregatedInsights.topTechnologies
                        .slice(0, 10)
                        .map((tech) => (
                          <Badge key={tech.name} variant="secondary">
                            {tech.name} ({tech.count})
                          </Badge>
                        ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold">Design Patterns</Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {results.consolidatedReport.aggregatedInsights.topPatterns
                        .slice(0, 10)
                        .map((pattern) => (
                          <Badge key={pattern.name} variant="outline">
                            {pattern.name} ({pattern.count})
                          </Badge>
                        ))}
                    </div>
                  </div>

                  {results.consolidatedReport.aggregatedInsights.keyAchievements.length > 0 && (
                    <div>
                      <Label className="text-sm font-semibold">Key Achievements</Label>
                      <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
                        {results.consolidatedReport.aggregatedInsights.keyAchievements.map(
                          (achievement, idx) => (
                            <li key={idx}>{achievement}</li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Individual Reports */}
              {results.consolidatedReport.individualReports.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Individual Reports</CardTitle>
                    <CardDescription>
                      Detailed analysis for each contribution
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {results.consolidatedReport.individualReports.map((report, idx) => (
                      <div key={idx} className="rounded-lg border p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {report.contributionMetadata.type === "pr"
                                ? `PR #${report.contributionMetadata.identifier}`
                                : `Commit ${report.contributionMetadata.identifier.slice(0, 7)}`}
                            </Badge>
                            {report.contributionMetadata.title && (
                              <span className="text-sm font-medium">
                                {report.contributionMetadata.title}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(report.markdownReport)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                downloadMarkdown(
                                  report.markdownReport,
                                  `${report.contributionMetadata.type}-${report.contributionMetadata.identifier}.md`
                                )
                              }
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <MarkdownRenderer content={report.markdownReport} />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

