"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Github, Upload, Sparkles, Key } from "lucide-react"

type WizardStep = "github" | "openai" | "resume" | "results"

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<WizardStep>("github")
  const [completedSteps, setCompletedSteps] = useState<Set<WizardStep>>(new Set())
  const [isCheckingStatus, setIsCheckingStatus] = useState(true)
  
  // GitHub state
  const [githubToken, setGithubToken] = useState("")
  const [isConnectingGithub, setIsConnectingGithub] = useState(false)
  const [githubError, setGithubError] = useState("")
  const [githubUsername, setGithubUsername] = useState("")
  
  // OpenAI state
  const [openaiKey, setOpenaiKey] = useState("")
  const [showOpenaiKey, setShowOpenaiKey] = useState(false)
  const [openaiError, setOpenaiError] = useState("")
  
  // Resume state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploadingResume, setIsUploadingResume] = useState(false)
  const [resumeError, setResumeError] = useState("")
  const [resumeId, setResumeId] = useState<string | null>(null)

  const steps = [
    { id: "github" as WizardStep, title: "Connect GitHub", icon: Github },
    { id: "openai" as WizardStep, title: "OpenAI API Key", icon: Key },
    { id: "resume" as WizardStep, title: "Upload Resume", icon: Upload },
    { id: "results" as WizardStep, title: "View Results", icon: Sparkles },
  ]

  // Check existing setup status on mount
  useEffect(() => {
    const checkExistingSetup = async () => {
      try {
        const completed = new Set<WizardStep>()
        
        // Check GitHub connection status
        try {
          const githubResponse = await fetch("/api/github/status")
          if (githubResponse.ok) {
            const data = await githubResponse.json()
            if (data.connected) {
              completed.add("github")
              if (data.username) {
                setGithubUsername(data.username)
              }
            }
          }
        } catch (error) {
          console.error("GitHub status check failed:", error)
        }

        // Check OpenAI key in database
        try {
          const openaiResponse = await fetch("/api/openai/key")
          if (openaiResponse.ok) {
            const openaiData = await openaiResponse.json()
            if (openaiData.hasKey) {
              completed.add("openai")
            }
          }
        } catch (error) {
          console.error("OpenAI key check failed:", error)
        }

        // Check if resume exists
        try {
          const resumeResponse = await fetch("/api/resume/upload")
          if (resumeResponse.ok) {
            const data = await resumeResponse.json()
            if (data.resumes && data.resumes.length > 0) {
              completed.add("resume")
            }
          }
        } catch (error) {
          console.error("Resume check failed:", error)
        }

        setCompletedSteps(completed)

        // Set current step to first incomplete step
        if (!completed.has("github")) {
          setCurrentStep("github")
        } else if (!completed.has("openai")) {
          setCurrentStep("openai")
        } else if (!completed.has("resume")) {
          setCurrentStep("resume")
        } else {
          setCurrentStep("results")
        }
      } catch (error) {
        console.error("Error checking setup status:", error)
      } finally {
        setIsCheckingStatus(false)
      }
    }

    checkExistingSetup()
  }, [])

  const handleConnectGithub = async (e: React.FormEvent) => {
    e.preventDefault()
    setGithubError("")
    setIsConnectingGithub(true)

    try {
      // Connect GitHub
      const connectResponse = await fetch("/api/github/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: githubToken }),
      })

      const connectData = await connectResponse.json()

      if (!connectResponse.ok) {
        setGithubError(connectData.error || "Failed to connect GitHub")
        setIsConnectingGithub(false)
        return
      }

      setGithubUsername(connectData.username)

      // Scan contributions
      const scanResponse = await fetch("/api/github/scan", {
        method: "POST",
      })

      if (!scanResponse.ok) {
        const scanData = await scanResponse.json()
        setGithubError(scanData.error || "Failed to scan GitHub")
        setIsConnectingGithub(false)
        return
      }

      // Mark step complete and move to next
      setCompletedSteps(new Set([...completedSteps, "github"]))
      setCurrentStep("openai")
      setGithubToken("") // Clear for security
    } catch (error) {
      setGithubError("An error occurred. Please try again.")
    } finally {
      setIsConnectingGithub(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const validTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"]
      if (!validTypes.includes(file.type)) {
        setResumeError("Please upload a PDF (recommended), DOCX, or TXT file")
        return
      }
      
      // Show a gentle warning if not PDF
      if (file.type !== "application/pdf") {
        setResumeError("")
      }
      
      setSelectedFile(file)
    }
  }

  const handleUploadResume = async () => {
    if (!selectedFile) {
      setResumeError("Please select a file")
      return
    }

    setIsUploadingResume(true)
    setResumeError("")

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)

      const response = await fetch("/api/resume/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setResumeError(data.error || "Failed to upload resume")
        setIsUploadingResume(false)
        return
      }

      setResumeId(data.resumeId)
      setCompletedSteps(new Set([...completedSteps, "resume"]))
      setCurrentStep("results")
    } catch (error) {
      setResumeError("An error occurred. Please try again.")
    } finally {
      setIsUploadingResume(false)
    }
  }

  const handleSaveOpenaiKey = async () => {
    if (!openaiKey.trim()) {
      setOpenaiError("Please enter your OpenAI API key")
      return
    }

    try {
      const response = await fetch("/api/openai/key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: openaiKey }),
      })

      const data = await response.json()

      if (!response.ok) {
        setOpenaiError(data.error || "Failed to save API key")
        return
      }

      setCompletedSteps(new Set([...completedSteps, "openai"]))
      setCurrentStep("resume")
      setOpenaiKey("") // Clear from state
      setOpenaiError("")
    } catch (error) {
      setOpenaiError("An error occurred. Please try again.")
    }
  }

  const handleSkipOpenai = () => {
    setCompletedSteps(new Set([...completedSteps, "openai"]))
    setCurrentStep("resume")
  }

  const handleSkipResume = () => {
    setCompletedSteps(new Set([...completedSteps, "resume"]))
    setCurrentStep("results")
  }

  const handleFinish = () => {
    router.push("/dashboard/brag-list")
  }

  if (isCheckingStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
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
          <h1 className="text-4xl font-bold">
            {completedSteps.size === 0 ? "Welcome to Career Keeper! 🎉" : "Continue Your Setup"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {completedSteps.size === 0 
              ? "Let's get you set up in just 3 simple steps"
              : `${completedSteps.size}/3 steps completed`
            }
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center gap-4">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isCompleted = completedSteps.has(step.id)
            const isCurrent = currentStep === step.id
            const isAccessible = index === 0 || completedSteps.has(steps[index - 1].id)

            return (
              <button
                key={step.id}
                onClick={() => isAccessible && setCurrentStep(step.id)}
                disabled={!isAccessible}
                className={`flex flex-col items-center gap-2 rounded-lg p-4 transition-all ${
                  isCurrent
                    ? "bg-primary text-primary-foreground shadow-lg scale-105"
                    : isCompleted
                    ? "bg-green-50 dark:bg-green-900/20 hover:scale-105"
                    : "bg-muted/50 opacity-50"
                } ${isAccessible ? "cursor-pointer" : "cursor-not-allowed"}`}
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
            <>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Github className="h-6 w-6" />
                  <CardTitle>
                    {completedSteps.has("github") ? "GitHub Already Connected ✓" : "Connect Your GitHub Account"}
                  </CardTitle>
                </div>
                <CardDescription>
                  {completedSteps.has("github")
                    ? "You can skip this step or reconnect with a different token"
                    : "We'll scan your repositories and contributions to build your brag list"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {completedSteps.has("github") && (
                  <div className="rounded-md bg-green-50 p-4 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
                    <div className="flex items-center gap-2 font-semibold mb-2">
                      <CheckCircle2 className="h-4 w-4" />
                      GitHub is already connected
                    </div>
                    <p className="text-xs">Your contributions have been scanned. You can proceed to the next step or reconnect if needed.</p>
                  </div>
                )}

                <div className="rounded-lg bg-muted p-4 text-sm">
                  <p className="font-semibold mb-2">How to create a GitHub Personal Access Token:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Go to GitHub Settings → Developer settings → Personal access tokens</li>
                    <li>Click "Generate new token (classic)"</li>
                    <li>Give it a name like "Career Keeper"</li>
                    <li>Select scopes: <code className="text-xs bg-background px-1 rounded">repo</code>, <code className="text-xs bg-background px-1 rounded">read:user</code></li>
                    <li>Click "Generate token" and copy it</li>
                  </ol>
                </div>

                {githubError && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    {githubError}
                  </div>
                )}

                {githubUsername && (
                  <div className="rounded-md bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
                    ✓ Connected as @{githubUsername}
                  </div>
                )}

                <form onSubmit={handleConnectGithub} className="space-y-4">
                  <div>
                    <label htmlFor="token" className="block text-sm font-medium mb-2">
                      GitHub Personal Access Token
                    </label>
                    <input
                      id="token"
                      type="password"
                      value={githubToken}
                      onChange={(e) => setGithubToken(e.target.value)}
                      required
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button type="submit" disabled={isConnectingGithub} className="flex-1">
                      {isConnectingGithub 
                        ? "Connecting & Scanning..." 
                        : completedSteps.has("github")
                        ? "Reconnect GitHub"
                        : "Connect & Scan GitHub"
                      }
                    </Button>
                    {completedSteps.has("github") && (
                      <Button type="button" onClick={() => setCurrentStep("openai")} variant="outline">
                        Skip to Next Step
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </>
          )}

          {currentStep === "openai" && (
            <>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Key className="h-6 w-6" />
                  <CardTitle>Add OpenAI API Key</CardTitle>
                </div>
                <CardDescription>
                  Enable AI-powered features like resume analysis and summary generation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 text-sm">
                  <div className="flex gap-2">
                    <div className="text-amber-600 dark:text-amber-500">🔒</div>
                    <div>
                      <p className="font-semibold text-amber-900 dark:text-amber-400 mb-1">
                        Your API key is secure
                      </p>
                      <ul className="text-amber-800 dark:text-amber-500 space-y-1 text-xs">
                        <li>✓ Stored only in your browser session (not on our servers)</li>
                        <li>✓ Automatically cleared when you close the browser</li>
                        <li>✓ Used only for your AI-powered features</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-muted p-4 text-sm">
                  <p className="font-semibold mb-2">How to get your OpenAI API key:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Go to <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">platform.openai.com/api-keys</a></li>
                    <li>Click "Create new secret key"</li>
                    <li>Give it a name like "Career Keeper"</li>
                    <li>Copy the key (starts with "sk-")</li>
                  </ol>
                </div>

                {openaiError && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    {openaiError}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label htmlFor="openai-key" className="block text-sm font-medium mb-2">
                      OpenAI API Key
                    </label>
                    <div className="relative">
                      <input
                        id="openai-key"
                        type={showOpenaiKey ? "text" : "password"}
                        value={openaiKey}
                        onChange={(e) => setOpenaiKey(e.target.value)}
                        placeholder="sk-..."
                        className="w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showOpenaiKey ? "👁️" : "👁️‍🗨️"}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={handleSaveOpenaiKey} className="flex-1">
                      Save API Key
                    </Button>
                    <Button onClick={handleSkipOpenai} variant="outline">
                      Skip for now
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground text-center">
                    You can always add this later in Settings
                  </p>
                </div>
              </CardContent>
            </>
          )}

          {currentStep === "resume" && (
            <>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Upload className="h-6 w-6" />
                  <CardTitle>Upload Your Resume</CardTitle>
                </div>
                <CardDescription>
                  Upload your resume in PDF format (preferred) for the best results
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 text-sm">
                  <div className="flex gap-2">
                    <div className="text-blue-600 dark:text-blue-500">💡</div>
                    <div>
                      <p className="font-semibold text-blue-900 dark:text-blue-400 mb-1">
                        Why PDF?
                      </p>
                      <ul className="text-blue-800 dark:text-blue-500 space-y-1 text-xs">
                        <li>✓ Preserves formatting and layout</li>
                        <li>✓ Best compatibility with AI analysis</li>
                        <li>✓ Professional standard for resumes</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-center">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      {selectedFile ? (
                        <span className="flex items-center justify-center gap-2">
                          {selectedFile.name}
                          {selectedFile.type === "application/pdf" && (
                            <Badge variant="secondary" className="text-xs">✓ PDF</Badge>
                          )}
                        </span>
                      ) : (
                        "Choose a file or drag it here"
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold text-primary">PDF recommended</span> · Also accepts DOCX, TXT (max 2MB)
                    </p>
                  </div>

                  <input
                    type="file"
                    onChange={handleFileSelect}
                    accept=".pdf,.docx,.txt"
                    className="hidden"
                    id="resume-upload"
                  />
                  <label htmlFor="resume-upload">
                    <Button type="button" variant="outline" className="mt-4" asChild>
                      <span>Select File</span>
                    </Button>
                  </label>
                </div>

                {resumeError && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    {resumeError}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    onClick={handleUploadResume}
                    disabled={!selectedFile || isUploadingResume}
                    className="flex-1"
                  >
                    {isUploadingResume ? "Uploading..." : "Upload Resume"}
                  </Button>
                  <Button onClick={handleSkipResume} variant="outline">
                    Skip for now
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {currentStep === "results" && (
            <>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-6 w-6" />
                  <CardTitle>You're All Set! 🎉</CardTitle>
                </div>
                <CardDescription>
                  Here's what you can do now
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="border-2">
                    <CardHeader>
                      <CardTitle className="text-lg">Brag List</CardTitle>
                      <CardDescription>
                        View and export your achievements
                      </CardDescription>
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
                        <CardDescription>
                          AI-powered improvement suggestions
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button onClick={() => router.push("/dashboard/resume/compare")} className="w-full">
                          Compare Resume
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  <Card className="border-2">
                    <CardHeader>
                      <CardTitle className="text-lg">AI Summary</CardTitle>
                      <CardDescription>
                        Generate professional summaries
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button onClick={() => router.push("/dashboard/summary")} className="w-full" variant="outline">
                        Generate Summary
                      </Button>
                    </CardContent>
                  </Card>

                  {!resumeId && (
                    <Card className="border-2">
                      <CardHeader>
                        <CardTitle className="text-lg">Upload Resume</CardTitle>
                        <CardDescription>
                          Add it later for comparisons
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button onClick={() => router.push("/dashboard/resume")} className="w-full" variant="outline">
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
          <p>Need help? Check out our <a href="/docs" className="text-primary hover:underline">documentation</a></p>
        </div>
      </div>
    </div>
  )
}

