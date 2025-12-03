"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { CheckCircle2, Eye, EyeOff, Key, Loader2, Lock } from "lucide-react"
import { useSaveOpenAIKeyMutation } from "@/lib/api/queries"
import { openaiKeySchema, type OpenAIKeyFormData } from "../onboarding-schema"

interface OpenAIOnboardingProps {
  onSuccess: () => void
  onSkip: () => void
}

export function OpenAIOnboarding({ onSuccess, onSkip }: OpenAIOnboardingProps) {
  const [showOpenaiKey, setShowOpenaiKey] = useState(false)

  // Mutations
  const saveOpenAIKeyMutation = useSaveOpenAIKeyMutation()

  // Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<OpenAIKeyFormData>({
    resolver: zodResolver(openaiKeySchema),
  })

  const handleSaveOpenaiKey = (data: OpenAIKeyFormData) => {
    saveOpenAIKeyMutation.mutate(data.apiKey, {
      onSuccess: () => {
        reset()
        onSuccess()
      },
    })
  }
  return (
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
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-800 dark:bg-amber-900/20">
          <div className="flex gap-2">
            <Lock className="h-5 w-5 text-amber-600 dark:text-amber-500" />
            <div>
              <p className="mb-1 font-semibold text-amber-900 dark:text-amber-400">
                Your API key is secure
              </p>
              <ul className="space-y-1 text-xs text-amber-800 dark:text-amber-500">
                <li className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Stored only in your browser session (not on
                  our servers)
                </li>
                <li className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Automatically cleared when you close the
                  browser
                </li>
                <li className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Used only for your AI-powered features
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-muted p-4 text-sm">
          <p className="mb-2 font-semibold">How to get your OpenAI API key:</p>
          <ol className="list-inside list-decimal space-y-1 text-muted-foreground">
            <li>
              Go to{" "}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                platform.openai.com/api-keys
              </a>
            </li>
            <li>Click "Create new secret key"</li>
            <li>Give it a name like "Career Keeper"</li>
            <li>Copy the key (starts with "sk-")</li>
          </ol>
        </div>

        {saveOpenAIKeyMutation.isError && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {saveOpenAIKeyMutation.error instanceof Error
              ? saveOpenAIKeyMutation.error.message
              : "Failed to save API key"}
          </div>
        )}

        <form onSubmit={handleSubmit(handleSaveOpenaiKey)} className="space-y-4">
          <div>
            <label htmlFor="openai-key" className="mb-2 block text-sm font-medium">
              OpenAI API Key
            </label>
            <div className="relative">
              <Input
                id="openai-key"
                type={showOpenaiKey ? "text" : "password"}
                {...register("apiKey")}
                placeholder="sk-..."
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showOpenaiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.apiKey && (
              <p className="mt-1 text-sm text-destructive">{errors.apiKey.message}</p>
            )}
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={saveOpenAIKeyMutation.isPending} className="flex-1">
              {saveOpenAIKeyMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save API Key"
              )}
            </Button>
            <Button type="button" onClick={onSkip} variant="outline">
              Skip for now
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            You can always add this later in Settings
          </p>
        </form>
      </CardContent>
    </>
  )
}
