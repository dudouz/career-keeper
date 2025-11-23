"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface OpenAIKeyInputProps {
  onKeySubmit: (apiKey: string) => void
  isLoading?: boolean
}

export function OpenAIKeyInput({ onKeySubmit, isLoading = false }: OpenAIKeyInputProps) {
  const [apiKey, setApiKey] = useState("")
  const [showKey, setShowKey] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (apiKey.trim()) {
      onKeySubmit(apiKey.trim())
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>OpenAI API Key</CardTitle>
        <CardDescription>
          Enter your OpenAI API key to enable AI-powered resume features
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription className="text-sm">
            🔒 <strong>Privacy Notice:</strong> Your API key is never stored in our database. 
            It's only used during your current session and is never saved permanently.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="api-key" className="text-sm font-medium">
              API Key
            </label>
            <div className="flex gap-2">
              <input
                id="api-key"
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isLoading}
                required
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowKey(!showKey)}
                disabled={isLoading}
              >
                {showKey ? "Hide" : "Show"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Get your API key from{" "}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-primary"
              >
                OpenAI Platform
              </a>
            </p>
          </div>

          <Button type="submit" disabled={!apiKey.trim() || isLoading} className="w-full">
            {isLoading ? "Validating..." : "Use API Key"}
          </Button>
        </form>

        <div className="rounded-lg bg-muted p-4 text-sm space-y-2">
          <p className="font-medium">Why do I need this?</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>AI-powered resume analysis and suggestions</li>
            <li>Generate professional summaries from your GitHub activity</li>
            <li>Compare your resume with your actual contributions</li>
          </ul>
          <p className="text-xs text-muted-foreground mt-2">
            Note: You'll be charged by OpenAI based on your usage. We recommend starting with GPT-4-turbo.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

