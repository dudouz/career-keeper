"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Github, Loader2, Eye, EyeOff, Upload } from "lucide-react"
import {
  useConnectGitHubMutation,
  useGitHubStatusQuery,
  useSaveOpenAIKeyMutation,
  useUploadResumeMutation,
} from "@/lib/api/queries"
import {
  githubTokenSchema,
  openaiKeySchema,
  resumeSchema,
  type GitHubTokenFormData,
  type OpenAIKeyFormData,
  type ResumeFormData,
} from "@/components/onboarding/onboarding-schema"

interface GithubOnboardingInlineProps {
  completedSteps: Set<string>
  onSuccess: () => void
  onSkip: () => void
}

export function GithubOnboardingInline({
  completedSteps,
  onSuccess,
  onSkip,
}: GithubOnboardingInlineProps) {
  const [githubError, setGithubError] = useState("")
  const { data: githubStatus } = useGitHubStatusQuery()
  const connectMutation = useConnectGitHubMutation()

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
        reset()
        onSuccess()
      },
      onError: (error) => {
        setGithubError(error instanceof Error ? error.message : "Failed to connect GitHub")
      },
    })
  }

  return (
    <div className="space-y-4">
      {completedSteps.has("github") && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="h-4 w-4" />
            GitHub is already connected
            {githubStatus?.username && ` as @${githubStatus.username}`}
          </div>
        </div>
      )}

      <div className="rounded-lg bg-muted p-3 text-xs">
        <p className="mb-1 font-semibold">How to create a GitHub Personal Access Token:</p>
        <ol className="list-inside list-decimal space-y-0.5 text-muted-foreground">
          <li>Go to GitHub Settings → Developer settings → Personal access tokens</li>
          <li>Click "Generate new token (classic)"</li>
          <li>
            Select scopes: <code className="rounded bg-background px-1">repo</code>,{" "}
            <code className="rounded bg-background px-1">read:user</code>
          </li>
          <li>Copy the token and paste it below</li>
        </ol>
      </div>

      {githubError && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{githubError}</div>
      )}

      <form onSubmit={handleSubmit(handleConnectGithub)} className="space-y-3">
        <div>
          <label htmlFor="token" className="mb-1 block text-sm font-medium">
            GitHub Personal Access Token
          </label>
          <Input
            id="token"
            type="password"
            {...register("token")}
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
          />
          {errors.token && <p className="mt-1 text-xs text-destructive">{errors.token.message}</p>}
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={connectMutation.isPending} className="flex-1">
            {connectMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : completedSteps.has("github") ? (
              "Reconnect"
            ) : (
              "Connect GitHub"
            )}
          </Button>
          {completedSteps.has("github") && (
            <Button type="button" onClick={onSkip} variant="outline">
              Next
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}

interface OpenAIOnboardingInlineProps {
  onSuccess: () => void
  onSkip: () => void
}

export function OpenAIOnboardingInline({ onSuccess, onSkip }: OpenAIOnboardingInlineProps) {
  const [showOpenaiKey, setShowOpenaiKey] = useState(false)
  const saveOpenAIKeyMutation = useSaveOpenAIKeyMutation()

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
    <div className="space-y-4">
      <div className="rounded-lg bg-muted p-3 text-xs">
        <p className="mb-1 font-semibold">How to get your OpenAI API key:</p>
        <ol className="list-inside list-decimal space-y-0.5 text-muted-foreground">
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

      <form onSubmit={handleSubmit(handleSaveOpenaiKey)} className="space-y-3">
        <div>
          <label htmlFor="openai-key" className="mb-1 block text-sm font-medium">
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
          {errors.apiKey && <p className="mt-1 text-xs text-destructive">{errors.apiKey.message}</p>}
        </div>

        <div className="flex gap-2">
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
            Skip
          </Button>
        </div>
      </form>
    </div>
  )
}

interface ResumeOnboardingInlineProps {
  onSuccess: () => void
  onSkip: () => void
}

export function ResumeOnboardingInline({ onSuccess, onSkip }: ResumeOnboardingInlineProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const uploadMutation = useUploadResumeMutation()

  const {
    setValue,
    handleSubmit,
    formState: { errors },
    trigger,
  } = useForm<ResumeFormData>({
    resolver: zodResolver(resumeSchema),
  })

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setValue("file", file)
      await trigger("file")
    }
  }

  const handleUploadResume = (data: ResumeFormData) => {
    uploadMutation.mutate(data.file, {
      onSuccess: () => {
        onSuccess()
      },
    })
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit(handleUploadResume)} className="space-y-4">
        <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 text-center">
          <Upload className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {selectedFile ? (
                <span className="flex items-center justify-center gap-2">
                  {selectedFile.name}
                  {selectedFile.type === "application/pdf" && (
                    <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                      <CheckCircle2 className="h-3 w-3" /> PDF
                    </Badge>
                  )}
                </span>
              ) : (
                "Choose a file or drag it here"
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-primary">PDF recommended</span> · Also accepts DOCX,
              TXT (max 2MB)
            </p>
          </div>
          <input
            type="file"
            onChange={handleFileSelect}
            accept=".pdf,.docx,.txt"
            className="hidden"
            id="resume-upload-inline"
          />
          <label htmlFor="resume-upload-inline">
            <Button type="button" variant="outline" className="mt-3" asChild>
              <span>Select File</span>
            </Button>
          </label>
        </div>

        {(errors.file || uploadMutation.isError) && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {errors.file?.message ||
              (uploadMutation.error instanceof Error
                ? uploadMutation.error.message
                : "Failed to upload resume")}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={!selectedFile || uploadMutation.isPending}
            className="flex-1"
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload Resume"
            )}
          </Button>
          <Button type="button" onClick={onSkip} variant="outline">
            Skip
          </Button>
        </div>
      </form>
    </div>
  )
}
