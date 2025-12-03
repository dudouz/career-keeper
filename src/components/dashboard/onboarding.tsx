"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useGitHubStatusQuery, useOpenAIKeyStatusQuery, useResumesQuery } from "@/lib/api/queries"
import {
  ArrowRight,
  Check,
  FileText,
  Key,
  Link2,
  RefreshCw,
  Sparkles,
  Wand2,
  X,
  Zap,
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export function OnboardingCard() {
  const [dismissed, setDismissed] = useState(false)

  // Use React Query hooks for data fetching
  const { data: githubStatus } = useGitHubStatusQuery()
  const { data: openaiKeyStatus } = useOpenAIKeyStatusQuery()
  const { data: resumesData } = useResumesQuery()

  // TODO: Replace with local storage key check / or if all steps are completed, set a local storage key
  if (dismissed) return null

  // Derive completion status from actual data
  const hasGithub = githubStatus?.connected ?? false
  const hasOpenAIKey = openaiKeyStatus?.hasKey ?? false
  const resumes = resumesData?.resumes ?? []
  const hasResume = resumes.length > 0

  const steps = [
    {
      id: "github",
      title: "GitHub PAT",
      icon: Link2,
      completed: hasGithub,
    },
    {
      id: "openai",
      title: "OpenAI Key",
      icon: Key,
      completed: hasOpenAIKey,
    },
    {
      id: "resume",
      title: "Resume Upload",
      icon: FileText,
      completed: hasResume,
    },
  ]

  const completedCount = steps.filter((s) => s.completed).length
  const allComplete = completedCount === steps.length

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
                <CardTitle className="text-xl">Quick Setup Wizard</CardTitle>
                <Badge variant={allComplete ? "default" : "secondary"} className="mt-1">
                  {completedCount}/{steps.length} Steps Complete
                </Badge>
              </div>
            </div>
            <CardDescription className="mt-2 flex items-center gap-2 text-base">
              {allComplete ? (
                <>
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span>All set! You can review your setup anytime.</span>
                </>
              ) : (
                "Complete a guided 3-step wizard to unlock all features"
              )}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDismissed(true)}
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
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
              <div
                key={step.id}
                className="flex flex-col items-center gap-1"
                style={{ width: "33%" }}
              >
                <Icon className="h-5 w-5" />
                <span className="text-center">{step.title}</span>
              </div>
            )
          })}
        </div>

        {/* CTA Button */}
        <div className="pt-2">
          <Button asChild className="h-12 w-full text-base font-semibold" size="lg">
            <Link href="/dashboard/onboarding" className="flex items-center justify-center gap-2">
              {allComplete ? (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Review Your Setup
                  <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  Start Guided Wizard
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Link>
          </Button>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Takes ~2 minutes • Step-by-step guidance included
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
