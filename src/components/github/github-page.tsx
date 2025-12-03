"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  useConnectGitHubMutation,
  useGitHubContributionsQuery,
  useGitHubStatusQuery,
  useScanGitHubContributionsMutation,
} from "@/lib/api/queries"
import type { GitHubContributionData } from "@/lib/db/types"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  AlertCircle,
  CheckCircle,
  GitBranch,
  Github,
  GitPullRequest,
  Loader2,
  Tag,
} from "lucide-react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { z } from "zod"

const tokenSchema = z.object({
  token: z
    .string()
    .min(1, "GitHub token is required")
    .startsWith("ghp_", "Must be a valid GitHub Personal Access Token"),
})

type TokenFormData = z.infer<typeof tokenSchema>

export function GitHubPage() {
  const { data: statusData, isLoading: isCheckingStatus } = useGitHubStatusQuery()
  const isConnected = statusData?.connected || false
  const { data: contributionsData } = useGitHubContributionsQuery({
    enabled: isConnected, // Only fetch when GitHub is connected
  })
  const connectMutation = useConnectGitHubMutation()
  const scanMutation = useScanGitHubContributionsMutation()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TokenFormData>({
    resolver: zodResolver(tokenSchema),
  })

  const contributions = (scanMutation.data?.contributions ||
    contributionsData?.contributions) as GitHubContributionData | null

  const onSubmit = async (data: TokenFormData) => {
    connectMutation.mutate(data.token, {
      onSuccess: () => {
        reset()
      },
    })
  }

  const handleScan = () => {
    scanMutation.mutate()
  }

  if (isCheckingStatus) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">GitHub Integration</h1>
          <p className="text-muted-foreground">
            Connect your GitHub account and scan your contributions
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Checking GitHub connection...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">GitHub Integration</h1>
        <p className="text-muted-foreground">
          Connect your GitHub account and scan your contributions
        </p>
      </div>

      {connectMutation.isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {connectMutation.error instanceof Error
              ? connectMutation.error.message
              : "Failed to connect GitHub"}
          </AlertDescription>
        </Alert>
      )}

      {connectMutation.isSuccess && (
        <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-900/20 dark:text-green-400">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Connected successfully! You can now scan your GitHub contributions.
          </AlertDescription>
        </Alert>
      )}

      {scanMutation.isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {scanMutation.error instanceof Error
              ? scanMutation.error.message
              : "Failed to scan GitHub"}
          </AlertDescription>
        </Alert>
      )}

      {scanMutation.isSuccess && (
        <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-900/20 dark:text-green-400">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>Successfully scanned your GitHub contributions!</AlertDescription>
        </Alert>
      )}

      {!isConnected && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Github className="h-5 w-5" />
              <CardTitle>Connect GitHub Account</CardTitle>
            </div>
            <CardDescription>
              Enter your GitHub Personal Access Token to scan your repositories and contributions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4 text-sm">
              <p className="mb-2 font-semibold">How to create a GitHub Personal Access Token:</p>
              <ol className="list-inside list-decimal space-y-1 text-muted-foreground">
                <li>Go to GitHub Settings → Developer settings → Personal access tokens</li>
                <li>Click "Generate new token (classic)"</li>
                <li>Give it a name like "Career Keeper"</li>
                <li>
                  Select scopes:{" "}
                  <code className="rounded bg-background px-1 py-0.5 text-xs">repo</code>,{" "}
                  <code className="rounded bg-background px-1 py-0.5 text-xs">read:user</code>
                </li>
                <li>Click "Generate token" and copy it</li>
              </ol>
              <p className="mt-2 text-xs">
                <strong>Note:</strong> Your token is encrypted and saved securely to your account.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label htmlFor="token" className="mb-2 block text-sm font-medium">
                  GitHub Personal Access Token
                </label>
                <Input
                  id="token"
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  variant={errors.token ? "error" : "default"}
                  {...register("token")}
                />
                {errors.token && (
                  <p className="mt-1 text-sm text-destructive">{errors.token.message}</p>
                )}
              </div>

              <Button type="submit" disabled={connectMutation.isPending} className="w-full">
                {connectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {connectMutation.isPending ? "Connecting..." : "Connect GitHub"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {isConnected && !contributions && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <CardTitle>GitHub Connected</CardTitle>
            </div>
            <CardDescription>
              Ready to scan your GitHub repositories and contributions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleScan} disabled={scanMutation.isPending} className="w-full">
              {scanMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {scanMutation.isPending ? "Scanning..." : "Scan GitHub Contributions"}
            </Button>
          </CardContent>
        </Card>
      )}

      {contributions && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Repositories</CardTitle>
                  <Github className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{contributions.repositories.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Commits</CardTitle>
                  <GitBranch className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{contributions.commits.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Pull Requests</CardTitle>
                  <GitPullRequest className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{contributions.pullRequests.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Releases</CardTitle>
                  <Tag className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{contributions.releases.length}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top Languages</CardTitle>
              <CardDescription>Programming languages used in your repositories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Object.entries(contributions.languages)
                  .sort(([, a], [, b]) => b - a)
                  .map(([lang, count]) => (
                    <Badge key={lang} variant="secondary">
                      {lang} ({count})
                    </Badge>
                  ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button onClick={handleScan} disabled={scanMutation.isPending} variant="outline">
              {scanMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {scanMutation.isPending ? "Scanning..." : "Rescan"}
            </Button>
            <Button asChild>
              <Link href="/dashboard/brag-list">View Brag List →</Link>
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
