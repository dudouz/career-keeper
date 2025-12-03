"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import type { GitHubContributionData } from "@/lib/db/types"

// TODO: Use lucide icons
// TODO: Extract page logic to a separate file
// TODO: Use react query for the API calls / State management
// TODO: Use zod/react hook form for the forms 

export default function GitHubPage() {
  const [token, setToken] = useState("")
  const [isConnecting, setIsConnecting] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [username, setUsername] = useState("")
  const [contributions, setContributions] = useState<GitHubContributionData | null>(null)
  const [isCheckingStatus, setIsCheckingStatus] = useState(true)

  // Derive connection status from username
  const isConnected = !!username

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsConnecting(true)

    try {
      const response = await fetch("/api/github/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to connect GitHub")
        return
      }

      setUsername(data.username)
      setSuccess(`Connected as @${data.username}. Rate limit: ${data.rateLimit.remaining}/${data.rateLimit.limit}`)
      setToken("") // Clear token from state for security
    } catch {
      setError("An error occurred. Please try again.")
    } finally {
      setIsConnecting(false)
    }
  }

  // Check if GitHub is already connected on mount
  useEffect(() => {
    async function checkGitHubStatus() {
      try {
        // Check if GitHub PAT is saved
        const statusResponse = await fetch("/api/github/status")
        if (statusResponse.ok) {
          const statusData = await statusResponse.json()
          if (statusData.connected) {
            setUsername(statusData.username || "user")
            
            // Try to load existing contributions
            try {
              const scanResponse = await fetch("/api/github/scan")
              if (scanResponse.ok) {
                const scanData = await scanResponse.json()
                if (scanData.contributions) {
                  setContributions(scanData.contributions)
                }
              }
            } catch (error) {
              console.error("Failed to load contributions:", error)
            }
          }
        }
      } catch (error) {
        console.error("Failed to check GitHub status:", error)
      } finally {
        setIsCheckingStatus(false)
      }
    }

    checkGitHubStatus()
  }, [])

  async function handleScan() {
    setError("")
    setSuccess("")
    setIsScanning(true)

    try {
      const response = await fetch("/api/github/scan", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to scan GitHub")
        return
      }

      setContributions(data.contributions)
      setSuccess("Successfully scanned your GitHub contributions!")
    } catch {
      setError("An error occurred while scanning.")
    } finally {
      setIsScanning(false)
    }
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
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

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
          {success}
        </div>
      )}

      {!isConnected && (
        <Card>
          <CardHeader>
            <CardTitle>Connect GitHub Account</CardTitle>
            <CardDescription>
              Enter your GitHub Personal Access Token to scan your repositories and contributions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4 text-sm">
              <p className="font-semibold mb-2">How to create a GitHub Personal Access Token:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Go to GitHub Settings → Developer settings → Personal access tokens</li>
                <li>Click "Generate new token (classic)"</li>
                <li>Give it a name like "Career Keeper"</li>
                <li>Select scopes: <code className="text-xs">repo</code>, <code className="text-xs">read:user</code></li>
                <li>Click "Generate token" and copy it</li>
              </ol>
              <p className="mt-2 text-xs">
                <strong>Note:</strong> Your token is encrypted and saved to your account.
              </p>
            </div>

            <form onSubmit={handleConnect} className="space-y-4">
              <div>
                <label htmlFor="token" className="block text-sm font-medium mb-2">
                  GitHub Personal Access Token
                </label>
                <input
                  id="token"
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>

              <Button type="submit" disabled={isConnecting} className="w-full">
                {isConnecting ? "Connecting..." : "Connect GitHub"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {isConnected && !contributions && (
        <Card>
          <CardHeader>
            <CardTitle>Connected as @{username}</CardTitle>
            <CardDescription>
              Ready to scan your GitHub repositories and contributions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleScan} disabled={isScanning} className="w-full">
              {isScanning ? "Scanning..." : "Scan GitHub Contributions"}
            </Button>
          </CardContent>
        </Card>
      )}

      {contributions && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Repositories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{contributions.repositories.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Commits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{contributions.commits.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pull Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{contributions.pullRequests.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Releases</CardTitle>
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
            <Button onClick={handleScan} disabled={isScanning} variant="outline">
              {isScanning ? "Scanning..." : "Rescan"}
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

