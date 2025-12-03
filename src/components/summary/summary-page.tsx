"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useGenerateSummaryMutation, useGitHubContributionsQuery } from "@/lib/api/queries"
import {
  AlertCircle,
  CheckCircle,
  Copy,
  Lightbulb,
  Loader2,
  RefreshCw,
  Save,
  Sparkles,
} from "lucide-react"
import { useState } from "react"

type Tone = "technical" | "leadership" | "hybrid"

interface SummaryResult {
  summary: string
  alternatives: string[]
}

export function SummaryPage() {
  const { data: contributionsData, isLoading: loadingContributions } = useGitHubContributionsQuery()
  // TODO: Destructure the data and loading,errors etc from the generateMutation obj
  const generateMutation = useGenerateSummaryMutation()

  const [currentSummary, setCurrentSummary] = useState("")
  const [tone, setTone] = useState<Tone>("hybrid")
  const [result, setResult] = useState<SummaryResult | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const contributions = contributionsData?.contributions

  const handleGenerate = async () => {
    if (!contributions) {
      return
    }

    generateMutation.mutate(
      {
        contributions,
        currentSummary: currentSummary || undefined,
        tone,
      },
      {
        onSuccess: (data) => {
          setResult(data)
        },
      }
    )
  }

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch {
      console.error("Failed to copy to clipboard")
    }
  }

  const toneDescriptions: Record<Tone, string> = {
    technical: "Focus on technical expertise, technologies, and hands-on contributions",
    leadership: "Emphasize leadership, mentorship, and strategic impact",
    hybrid: "Balance technical skills with leadership and collaboration",
  }

  if (loadingContributions) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Resume Summary Generator</h1>
          <p className="text-muted-foreground">
            AI-powered professional summaries from your GitHub activity
          </p>
        </div>
        <Card>
          <CardContent className="py-8 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
            <p className="mt-2 text-muted-foreground">Loading contributions...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Resume Summary Generator</h1>
        <p className="text-muted-foreground">
          AI-powered professional summaries from your GitHub activity
        </p>
      </div>

      {/* Generator Card */}
      {!result && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <CardTitle>Generate Summary</CardTitle>
            </div>
            <CardDescription>
              Create a compelling professional summary based on your contributions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Summary Input */}
            <div className="space-y-2">
              <label htmlFor="current-summary" className="text-sm font-medium">
                Current Summary (Optional)
              </label>
              <Textarea
                id="current-summary"
                value={currentSummary}
                onChange={(e) => setCurrentSummary(e.target.value)}
                placeholder="Paste your existing resume summary here to improve it, or leave blank to generate a new one..."
                rows={4}
                className="resize-y"
              />
            </div>

            {/* Tone Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Select Tone</label>
              <div className="grid gap-3">
                {(["technical", "leadership", "hybrid"] as Tone[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTone(t)}
                    className={`rounded-lg border p-4 text-left transition-all ${
                      tone === t
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-semibold capitalize">{t}</span>
                      {tone === t && <Badge variant="default">Selected</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{toneDescriptions[t]}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* GitHub Status */}
            <Alert>
              <AlertDescription className="flex items-center gap-2">
                {contributions ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>
                      GitHub data loaded: {contributions.commits.length} commits,{" "}
                      {contributions.repositories.length} repositories
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <span>No GitHub data found. Please connect your GitHub account first.</span>
                  </>
                )}
              </AlertDescription>
            </Alert>

            {generateMutation.isError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {generateMutation.error instanceof Error
                    ? generateMutation.error.message
                    : "Failed to generate summary"}
                </AlertDescription>
              </Alert>
            )}

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={generateMutation.isPending || !contributions}
              className="w-full"
              size="lg"
            >
              {generateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {generateMutation.isPending ? "Generating..." : "Generate Summary"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    <CardTitle>Primary Summary</CardTitle>
                  </div>
                  <CardDescription>Your AI-generated professional summary</CardDescription>
                </div>
                <Badge variant="default" className="capitalize">
                  {tone}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm leading-relaxed">{result.summary}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => copyToClipboard(result.summary, -1)}>
                  {copiedIndex === -1 ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy to Clipboard
                    </>
                  )}
                </Button>
                <Button variant="outline">
                  <Save className="mr-2 h-4 w-4" />
                  Save to Resume
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alternative Versions</CardTitle>
              <CardDescription>Try these variations for different emphasis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.alternatives.map((alt, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Alternative {index + 1}</span>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(alt, index)}>
                      {copiedIndex === index ? (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-sm leading-relaxed text-muted-foreground">{alt}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-center gap-4">
                <Button
                  onClick={() => {
                    setResult(null)
                  }}
                  variant="outline"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Generate New Summary
                </Button>
                <Button
                  onClick={() => {
                    setCurrentSummary(result.summary)
                    setResult(null)
                  }}
                  variant="outline"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Refine This Summary
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Help Section */}
      <Card className="bg-muted/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            <CardTitle className="text-lg">Tips for Best Results</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-primary">•</span>
              <span>
                <strong>Technical tone:</strong> Best for software engineering and IC roles
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-primary">•</span>
              <span>
                <strong>Leadership tone:</strong> Ideal for senior/management positions
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-primary">•</span>
              <span>
                <strong>Hybrid tone:</strong> Perfect for senior engineers with mentoring experience
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-primary">•</span>
              <span>
                Provide your current summary to get an improved version tailored to your recent work
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
