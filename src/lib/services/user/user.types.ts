export interface SaveOpenAIKeyParams {
  userId: string
  userEmail: string
  userName?: string | null
  userImage?: string | null
  apiKey: string
}

export interface GetOpenAIKeyResult {
  hasKey: boolean
  apiKey?: string
}
