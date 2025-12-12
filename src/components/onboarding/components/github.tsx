"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { CheckCircle2, Github, Loader2 } from "lucide-react"
import {
  useConnectGitHubMutation,
  useGitHubStatusQuery,
  useScanGitHubContributionsMutation,
} from "@/lib/api/queries"
import { githubTokenSchema, type GitHubTokenFormData } from "../onboarding-schema"

interface GithubOnboardingProps {
  completedSteps: Set<string>
  onSuccess: () => void
  onSkip: () => void
}

export function GithubOnboarding({ completedSteps, onSuccess, onSkip }: GithubOnboardingProps) {
  const [githubError, setGithubError] = useState("")

  // Queries
  const { data: githubStatus } = useGitHubStatusQuery()

  // Mutations
  const connectMutation = useConnectGitHubMutation()
  const scanMutation = useScanGitHubContributionsMutation()

  // Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<GitHubTokenFormData>({
    resolver: zodResolver(githubTokenSchema),
  })

  const handleConnectGithub = (data: GitHubTokenFormData) => {
    setGithubError("")

    connectMutation.mutate(data.token, {
      onSuccess: () => {
        // Scan contributions after connecting
        scanMutation.mutate(undefined, {
          onSuccess: () => {
            reset()
            onSuccess()
          },
          onError: (error) => {
            setGithubError(error instanceof Error ? error.message : "Failed to scan GitHub")
          },
        })
      },
      onError: (error) => {
        setGithubError(error instanceof Error ? error.message : "Failed to connect GitHub")
      },
    })
  }

  const isConnecting = connectMutation.isPending || scanMutation.isPending

  return (
    <>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Github className="h-6 w-6" />
          <CardTitle>
            {completedSteps.has("github") ? (
              <span className="flex items-center gap-2">
                GitHub Already Connected <CheckCircle2 className="h-5 w-5 text-green-600" />
              </span>
            ) : (
              "Connect Your GitHub Account"
            )}
          </CardTitle>
        </div>
        <CardDescription>
          {completedSteps.has("github")
            ? "You can skip this step or reconnect with a different token"
            : "We'll scan your repositories and contributions to build your achievements"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {completedSteps.has("github") && (
          <div className="rounded-md bg-green-50 p-4 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
            <div className="mb-2 flex items-center gap-2 font-semibold">
              <CheckCircle2 className="h-4 w-4" />
              GitHub is already connected
            </div>
            <p className="text-xs">
              Your contributions have been scanned. You can proceed to the next step or reconnect if
              needed.
            </p>
          </div>
        )}

        <div className="rounded-lg bg-muted p-4 text-sm">
          <p className="mb-2 font-semibold">How to create a GitHub Personal Access Token:</p>
          <ol className="list-inside list-decimal space-y-1 text-muted-foreground">
            <li>Go to GitHub Settings → Developer settings → Personal access tokens</li>
            <li>Click "Generate new token (classic)"</li>
            <li>Give it a name like "Career Keeper"</li>
            <li>
              Select scopes: <code className="rounded bg-background px-1 text-xs">repo</code>,{" "}
              <code className="rounded bg-background px-1 text-xs">read:user</code>
            </li>
            <li>Click "Generate token" and copy it</li>
          </ol>
        </div>

        {githubError && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {githubError}
          </div>
        )}

        {githubStatus?.connected && githubStatus.username && (
          <div className="flex items-center gap-2 rounded-md bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            Connected as @{githubStatus.username}
          </div>
        )}

        <form onSubmit={handleSubmit(handleConnectGithub)} className="space-y-4">
          <div>
            <label htmlFor="token" className="mb-2 block text-sm font-medium">
              GitHub Personal Access Token
            </label>
            <Input
              id="token"
              type="password"
              {...register("token")}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            />
            {errors.token && (
              <p className="mt-1 text-sm text-destructive">{errors.token.message}</p>
            )}
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={isConnecting} className="flex-1">
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting & Scanning...
                </>
              ) : completedSteps.has("github") ? (
                "Reconnect GitHub"
              ) : (
                "Connect & Scan GitHub"
              )}
            </Button>
            {completedSteps.has("github") && (
              <Button type="button" onClick={onSkip} variant="outline">
                Skip to Next Step
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </>
  )
}
