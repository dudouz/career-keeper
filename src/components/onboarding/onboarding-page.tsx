"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  useGitHubStatusQuery,
  useOpenAIKeyStatusQuery,
  useResumesQuery,
} from "@/lib/api/queries"
import {
  CheckCircle2,
  Github,
  Key,
  Loader2,
  PartyPopper,
  Sparkles,
  Upload,
} from "lucide-react"
import { GithubOnboarding } from "./components/github"
import { OpenAIOnboarding } from "./components/openai"
import { ResumeOnboarding } from "./components/resume"

type WizardStep = "github" | "openai" | "resume" | "results"

const steps = [
  { id: "github" as WizardStep, title: "Connect GitHub", icon: Github },
  { id: "openai" as WizardStep, title: "OpenAI API Key", icon: Key },
  { id: "resume" as WizardStep, title: "Upload Resume", icon: Upload },
  { id: "results" as WizardStep, title: "View Results", icon: Sparkles },
]

export function OnboardingPage() {
  const router = useRouter()
  const [manualStep, setManualStep] = useState<WizardStep | null>(null)

  // Queries
  const { data: githubStatus, isLoading: loadingGithubStatus } = useGitHubStatusQuery()
  const { data: openaiKeyStatus, isLoading: loadingOpenAIStatus } = useOpenAIKeyStatusQuery()
  const { data: resumesData, isLoading: loadingResumes } = useResumesQuery()

  // Derive completed steps from query data
  const completedSteps = useMemo(() => {
    const completed = new Set<WizardStep>()

    if (githubStatus?.connected) {
      completed.add("github")
    }

    if (openaiKeyStatus?.hasKey) {
      completed.add("openai")
    }

    if (resumesData?.resumes && resumesData.resumes.length > 0) {
      completed.add("resume")
    }

    return completed
  }, [githubStatus, openaiKeyStatus, resumesData])

  // Derive current step: use manual selection if set, otherwise auto-navigate to first incomplete step
  const currentStep = useMemo(() => {
    if (manualStep) {
      return manualStep
    }

    // Auto-navigate to first incomplete step
    if (!completedSteps.has("github")) {
      return "github"
    }
    if (!completedSteps.has("openai")) {
      return "openai"
    }
    if (!completedSteps.has("resume")) {
      return "resume"
    }
    return "results"
  }, [manualStep, completedSteps])

  // Derive resumeId from query data
  const resumeId = useMemo(() => {
    return resumesData?.resumes?.[0]?.id ?? null
  }, [resumesData])

  // Step handlers
  const handleGithubSuccess = () => {
    setManualStep("openai")
  }

  const handleGithubSkip = () => {
    setManualStep("openai")
  }

  const handleOpenAISuccess = () => {
    setManualStep("resume")
  }

  const handleOpenAISkip = () => {
    setManualStep("resume")
  }

  const handleResumeSuccess = () => {
    setManualStep("results")
  }

  const handleResumeSkip = () => {
    setManualStep("results")
  }

  const handleFinish = () => {
    router.push("/dashboard/brag-list")
  }

  const isCheckingStatus = loadingGithubStatus || loadingOpenAIStatus || loadingResumes

  if (isCheckingStatus) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted/20 p-8">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Checking your setup status...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="flex items-center justify-center gap-2 text-4xl font-bold">
            {completedSteps.size === 0 ? (
              <>
                Welcome to Career Keeper! <PartyPopper className="h-8 w-8" />
              </>
            ) : (
              "Continue Your Setup"
            )}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {completedSteps.size === 0
              ? "Let's get you set up in just 3 simple steps"
              : `${completedSteps.size}/3 steps completed`}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center gap-4">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isCompleted = completedSteps.has(step.id)
            const isCurrent = currentStep === step.id
            const isAccessible = index === 0 || completedSteps.has(steps[index - 1].id)

            // Determine step styling
            let stepStyle = "bg-muted/50 opacity-50"
            if (isCurrent) {
              stepStyle = "scale-105 bg-primary text-primary-foreground shadow-lg"
            } else if (isCompleted) {
              stepStyle = "bg-green-50 hover:scale-105 dark:bg-green-900/20"
            }

            const cursorStyle = isAccessible ? "cursor-pointer" : "cursor-not-allowed"

            return (
              <button
                key={step.id}
                onClick={() => isAccessible && setManualStep(step.id)}
                disabled={!isAccessible}
                className={`flex flex-col items-center gap-2 rounded-lg p-4 transition-all ${stepStyle} ${cursorStyle}`}
              >
                <div className="relative">
                  <Icon className="h-6 w-6" />
                  {isCompleted && (
                    <CheckCircle2 className="absolute -right-2 -top-2 h-4 w-4 text-green-600" />
                  )}
                </div>
                <span className="text-xs font-medium">{step.title}</span>
              </button>
            )
          })}
        </div>

        {/* Step Content */}
        <Card className="border-2">
          {currentStep === "github" && (
            <GithubOnboarding
              completedSteps={completedSteps}
              onSuccess={handleGithubSuccess}
              onSkip={handleGithubSkip}
            />
          )}

          {currentStep === "openai" && (
            <OpenAIOnboarding onSuccess={handleOpenAISuccess} onSkip={handleOpenAISkip} />
          )}

          {currentStep === "resume" && (
            <ResumeOnboarding onSuccess={handleResumeSuccess} onSkip={handleResumeSkip} />
          )}

          {currentStep === "results" && (
            <>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-6 w-6" />
                  <CardTitle className="flex items-center gap-2">
                    You're All Set! <PartyPopper className="h-5 w-5" />
                  </CardTitle>
                </div>
                <CardDescription>Here's what you can do now</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="border-2">
                    <CardHeader>
                      <CardTitle className="text-lg">Brag List</CardTitle>
                      <CardDescription>View and export your achievements</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button onClick={() => router.push("/dashboard/brag-list")} className="w-full">
                        View Brag List
                      </Button>
                    </CardContent>
                  </Card>

                  {resumeId && (
                    <Card className="border-2">
                      <CardHeader>
                        <CardTitle className="text-lg">Resume Comparison</CardTitle>
                        <CardDescription>AI-powered improvement suggestions</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button
                          onClick={() => router.push("/dashboard/resume/compare")}
                          className="w-full"
                        >
                          Compare Resume
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  <Card className="border-2">
                    <CardHeader>
                      <CardTitle className="text-lg">AI Summary</CardTitle>
                      <CardDescription>Generate professional summaries</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={() => router.push("/dashboard/summary")}
                        className="w-full"
                        variant="outline"
                      >
                        Generate Summary
                      </Button>
                    </CardContent>
                  </Card>

                  {!resumeId && (
                    <Card className="border-2">
                      <CardHeader>
                        <CardTitle className="text-lg">Upload Resume</CardTitle>
                        <CardDescription>Add it later for comparisons</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button
                          onClick={() => router.push("/dashboard/resume")}
                          className="w-full"
                          variant="outline"
                        >
                          Upload Now
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <Button onClick={handleFinish} className="w-full" size="lg">
                  Go to Dashboard
                </Button>
              </CardContent>
            </>
          )}
        </Card>

        {/* Help Text */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Need help? Check out our{" "}
            <a href="/docs" className="text-primary hover:underline">
              documentation
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
