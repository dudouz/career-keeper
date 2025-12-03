"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Zap } from "lucide-react"

export function OnboardingCard() {
  const [dismissed, setDismissed] = useState(false)
  const [resumes, setResumes] = useState<unknown[] | null>(null)
  const [githubStatus, setGithubStatus] = useState<{ connected: boolean } | null>(null)
  const [hasOpenAIKey, setHasOpenAIKey] = useState(false)

  // TODO: Replace with react query
  useEffect(() => {
    async function checkStatus() {
      try {
        // Check GitHub status
        const githubResponse = await fetch("/api/github/status")
        if (githubResponse.ok) {
          const githubData = await githubResponse.json()
          setGithubStatus(githubData)
        }

        // Check OpenAI key in database
        const openaiResponse = await fetch("/api/openai/key")
        if (openaiResponse.ok) {
          const openaiData = await openaiResponse.json()
          setHasOpenAIKey(openaiData.hasKey || false)
        }

        // Check if user has uploaded a resume
        const resumeResponse = await fetch("/api/resume/upload")
        if (resumeResponse.ok) {
          const resumeData = await resumeResponse.json()
          setResumes(resumeData.resumes || [])
        }
      } catch (error) {
        console.error("Failed to check status:", error)
        setGithubStatus({ connected: false })
        setHasOpenAIKey(false)
        setResumes([])
      }
    }
    
    checkStatus()
  }, [])

  // TODO: Replace with local storage key check / or if all steps are completed, set a local storage key
  if (dismissed) return null

  // Derive completion status from actual data
  const hasGithub = githubStatus?.connected ?? false
  const hasResume = resumes !== null && resumes.length > 0

  // TODO: Use lucide icons
  const steps = [
    {
      id: "github",
      title: "GitHub PAT",
      icon: "🔗",
      completed: hasGithub,
    },
    {
      id: "openai",
      title: "OpenAI Key",
      icon: "🔑",
      completed: hasOpenAIKey,
    },
    {
      id: "resume",
      title: "Resume Upload",
      icon: "📄",
      completed: hasResume,
    },
  ]

  const completedCount = steps.filter(s => s.completed).length
  const allComplete = completedCount === steps.length

  return (
    <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent shadow-lg">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
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
            <CardDescription className="text-base mt-2">
              {allComplete 
                ? "🎉 All set! You can review your setup anytime."
                : "Complete a guided 3-step wizard to unlock all features"}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDismissed(true)}
            className="text-muted-foreground hover:text-foreground shrink-0"
          >
            ✕
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Steps */}
        <div className="flex items-center justify-between gap-2">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex items-center gap-2 flex-1">
              <div
                className={`flex items-center justify-center h-10 w-10 rounded-full border-2 transition-all ${
                  step.completed
                    ? "bg-green-500 border-green-500 text-white"
                    : "bg-muted border-muted-foreground/30 text-muted-foreground"
                }`}
              >
                {step.completed ? (
                  <span className="text-lg">✓</span>
                ) : (
                  <span className="text-sm font-bold">{idx + 1}</span>
                )}
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`h-[2px] flex-1 transition-colors ${
                    step.completed ? "bg-green-500" : "bg-muted-foreground/20"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Labels */}
        <div className="flex justify-between text-xs text-muted-foreground">
          {steps.map((step) => (
            <div key={step.id} className="flex flex-col items-center gap-1" style={{ width: "33%" }}>
              <span>{step.icon}</span>
              <span className="text-center">{step.title}</span>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="pt-2">
          <Button asChild className="w-full h-12 text-base font-semibold" size="lg">
            <Link href="/dashboard/onboarding" className="flex items-center justify-center gap-2">
              {allComplete ? (
                <>
                  🔄 Review Your Setup
                  <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                <>
                  🧙‍♂️ Start Guided Wizard
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Link>
          </Button>
          <p className="text-xs text-center text-muted-foreground mt-2">
            Takes ~2 minutes • Step-by-step guidance included
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

