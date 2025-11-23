"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { GitHubContributionData } from "@/lib/db/types"

type Tone = "technical" | "leadership" | "hybrid"

interface SummaryResult {
  summary: string
  alternatives: string[]
}

export default function SummaryGeneratorPage() {
  const [loading, setLoading] = useState(false)
  const [contributions, setContributions] = useState<GitHubContributionData | null>(null)
  const [currentSummary, setCurrentSummary] = useState("")
  const [tone, setTone] = useState<Tone>("hybrid")
  const [result, setResult] = useState<SummaryResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  useEffect(() => {
    loadContributions()
  }, [])

  const loadContributions = async () => {
    try {
      const response = await fetch("/api/github/scan")
      if (response.ok) {
        const data = await response.json()
        setContributions(data.data)
      }
    } catch (err) {
      console.error("Failed to load contributions:", err)
    }
  }

  const handleGenerate = async () => {
    if (!contributions) {
      setError("Please scan your GitHub contributions first")
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/llm/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contributions,
          currentSummary: currentSummary || undefined,
          tone,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate summary")
      }

      const data = await response.json()
      setResult(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate summary")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const toneDescriptions: Record<Tone, string> = {
    technical: "Focus on technical expertise, technologies, and hands-on contributions",
    leadership: "Emphasize leadership, mentorship, and strategic impact",
    hybrid: "Balance technical skills with leadership and collaboration",
  }

  return (
    <div className="p-8 space-y-6">
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
            <CardTitle>Generate Summary</CardTitle>
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
              <textarea
                id="current-summary"
                value={currentSummary}
                onChange={(e) => setCurrentSummary(e.target.value)}
                placeholder="Paste your existing resume summary here to improve it, or leave blank to generate a new one..."
                rows={4}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
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
                    className={`p-4 border rounded-lg text-left transition-all ${
                      tone === t
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold capitalize">{t}</span>
                      {tone === t && (
                        <Badge variant="default">Selected</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {toneDescriptions[t]}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* GitHub Status */}
            <Alert>
              <AlertDescription className="flex items-center gap-2">
                {contributions ? (
                  <>
                    <span className="text-green-500">✓</span>
                    <span>
                      GitHub data loaded: {contributions.commits.length} commits,{" "}
                      {contributions.repositories.length} repositories
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-yellow-500">⚠</span>
                    <span>
                      No GitHub data found. Please connect your GitHub account first.
                    </span>
                  </>
                )}
              </AlertDescription>
            </Alert>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={loading || !contributions}
              className="w-full"
              size="lg"
            >
              {loading ? "Generating..." : "Generate Summary"}
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
                  <CardTitle>Primary Summary</CardTitle>
                  <CardDescription>
                    Your AI-generated professional summary
                  </CardDescription>
                </div>
                <Badge variant="default" className="capitalize">
                  {tone}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm leading-relaxed">{result.summary}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(result.summary, -1)}
                >
                  {copiedIndex === -1 ? "Copied!" : "Copy to Clipboard"}
                </Button>
                <Button variant="outline">
                  Save to Resume
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alternative Versions</CardTitle>
              <CardDescription>
                Try these variations for different emphasis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.alternatives.map((alt, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Alternative {index + 1}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(alt, index)}
                    >
                      {copiedIndex === index ? "Copied!" : "Copy"}
                    </Button>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {alt}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={() => {
                    setResult(null)
                    setError(null)
                  }}
                  variant="outline"
                >
                  Generate New Summary
                </Button>
                <Button
                  onClick={() => {
                    setCurrentSummary(result.summary)
                    setResult(null)
                    setError(null)
                  }}
                  variant="outline"
                >
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
          <CardTitle className="text-lg">Tips for Best Results</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>
                <strong>Technical tone:</strong> Best for software engineering and IC roles
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>
                <strong>Leadership tone:</strong> Ideal for senior/management positions
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>
                <strong>Hybrid tone:</strong> Perfect for senior engineers with mentoring experience
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
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

