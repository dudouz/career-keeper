"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useGitHubStatusQuery, useOpenAIKeyStatusQuery, useResumesQuery, useActiveSnapshotQuery } from "@/lib/api/queries"
import {
  Check,
  FileText,
  Key,
  Link2,
  Sparkles,
  X,
  Zap,
} from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  GithubOnboardingInline,
  OpenAIOnboardingInline,
  ResumeOnboardingInline,
} from "@/components/dashboard/onboarding-inline"

type WizardStep = "github" | "openai" | "resume" | null

export function OnboardingCard() {
  const router = useRouter()
  const [dismissed, setDismissed] = useState(false)
  const [expandedStep, setExpandedStep] = useState<WizardStep>(null)

  // Use React Query hooks for data fetching
  const { data: githubStatus, isLoading: loadingGithubStatus } = useGitHubStatusQuery()
  const { data: openaiKeyStatus, isLoading: loadingOpenAIStatus } = useOpenAIKeyStatusQuery()
  const { data: resumesData, isLoading: loadingResumes } = useResumesQuery()
  const { data: snapshotData, isLoading: loadingSnapshot } = useActiveSnapshotQuery()

  // Don't show onboarding if there's an active snapshot
  const hasActiveSnapshot = !!snapshotData?.data
  const isCheckingStatus = loadingGithubStatus || loadingOpenAIStatus || loadingResumes || loadingSnapshot

  // Derive completion status from actual data
  const hasGithub = githubStatus?.connected ?? false
  const hasOpenAIKey = openaiKeyStatus?.hasKey ?? false
  const resumes = resumesData?.resumes ?? []
  const hasResume = resumes.length > 0

  const steps = [
    {
      id: "github" as WizardStep,
      title: "GitHub PAT",
      icon: Link2,
      completed: hasGithub,
    },
    {
      id: "openai" as WizardStep,
      title: "OpenAI Key",
      icon: Key,
      completed: hasOpenAIKey,
    },
    {
      id: "resume" as WizardStep,
      title: "Resume Upload",
      icon: FileText,
      completed: hasResume,
    },
  ]

  const completedSteps = new Set(steps.filter((s) => s.completed).map((s) => s.id))
  const completedCount = completedSteps.size
  const allComplete = completedCount === steps.length

  // Auto-expand first incomplete step
  useEffect(() => {
    if (!expandedStep && !allComplete) {
      const firstIncomplete = steps.find((s) => !s.completed)
      if (firstIncomplete) {
        setExpandedStep(firstIncomplete.id)
      }
    }
  }, [expandedStep, allComplete, steps])

  // Redirect to AI analysis when all steps completed (but only if no active snapshot)
  // IMPORTANT: Wait for all data to load before redirecting
  useEffect(() => {
    if (allComplete && !hasActiveSnapshot && !isCheckingStatus) {
      const timer = setTimeout(() => {
        router.push("/dashboard/agents")
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [allComplete, hasActiveSnapshot, isCheckingStatus, router])

  // Don't render if dismissed, has active snapshot, or still loading snapshot data
  if (dismissed || hasActiveSnapshot || isCheckingStatus) return null

  const handleGithubSuccess = () => {
    setExpandedStep("openai")
  }

  const handleGithubSkip = () => {
    setExpandedStep("openai")
  }

  const handleOpenAISuccess = () => {
    setExpandedStep("resume")
  }

  const handleOpenAISkip = () => {
    setExpandedStep("resume")
  }

  const handleResumeSuccess = () => {
    // Will redirect via useEffect when allComplete becomes true
  }

  const handleResumeSkip = () => {
    // Even if skipped, if all other steps are done, redirect (but only if no active snapshot)
    if (hasGithub && hasOpenAIKey && !hasActiveSnapshot) {
      router.push("/dashboard/agents")
    }
  }

  return (
    <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent shadow-lg">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Quick Setup</CardTitle>
                <Badge variant={allComplete ? "default" : "secondary"} className="mt-1">
                  {completedCount}/{steps.length} Steps Complete
                </Badge>
              </div>
            </div>
            <CardDescription className="mt-2 flex items-center gap-2 text-base">
              {allComplete ? (
                <>
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span>Setup complete! Redirecting to AI Analysis...</span>
                </>
              ) : (
                "Complete these 3 steps to unlock all features"
              )}
            </CardDescription>
          </div>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="flex w-full flex-col space-y-4">
        {/* Progress Steps */}
        <div className="justify- mb-4 flex w-full items-center">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex flex-1 items-center">
              <div
                className={`h-[2px] flex-1 transition-colors ${
                  step.completed ? "bg-green-500" : "bg-muted-foreground/20"
                }`}
              />
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                  step.completed
                    ? "border-green-500 bg-green-500 text-white"
                    : expandedStep === step.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/30 bg-muted text-muted-foreground"
                }`}
              >
                {step.completed ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-bold">{idx + 1}</span>
                )}
              </div>

              <div
                className={`h-[2px] flex-1 transition-colors ${
                  step.completed ? "bg-green-500" : "bg-muted-foreground/20"
                }`}
              />
            </div>
          ))}
        </div>

        {/* Step Labels */}
        <div className="flex justify-between text-xs text-muted-foreground">
          {steps.map((step) => {
            const Icon = step.icon
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => !step.completed && setExpandedStep(step.id)}
                disabled={step.completed}
                className={`flex flex-col items-center gap-1 transition-colors ${
                  step.completed
                    ? "cursor-default"
                    : expandedStep === step.id
                      ? "text-primary"
                      : "cursor-pointer hover:text-foreground"
                }`}
                style={{ width: "33%" }}
              >
                <Icon className="h-5 w-5" />
                <span className="text-center">{step.title}</span>
              </button>
            )
          })}
        </div>

        {/* Expanded Step Content */}
        {expandedStep && !allComplete && (
          <div className="mt-4 rounded-lg border bg-card p-6">
            {expandedStep === "github" && (
              <GithubOnboardingInline
                completedSteps={completedSteps}
                onSuccess={handleGithubSuccess}
                onSkip={handleGithubSkip}
              />
            )}

            {expandedStep === "openai" && (
              <OpenAIOnboardingInline onSuccess={handleOpenAISuccess} onSkip={handleOpenAISkip} />
            )}

            {expandedStep === "resume" && (
              <ResumeOnboardingInline onSuccess={handleResumeSuccess} onSkip={handleResumeSkip} />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
