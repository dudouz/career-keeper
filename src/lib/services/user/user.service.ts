import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { encryptToken, decryptToken } from "@/lib/github/encryption"
import { eq } from "drizzle-orm"
import type { SaveOpenAIKeyParams, GetOpenAIKeyResult } from "./user.types"

/**
 * Save or update user's OpenAI API key (encrypted)
 */
export async function saveOpenAIKey(params: SaveOpenAIKeyParams): Promise<void> {
  const { userId, userEmail, userName, userImage, apiKey } = params

  // Encrypt the API key
  const encryptedKey = encryptToken(apiKey)

  // Check if user exists
  const [existingUser] = await db.select().from(users).where(eq(users.id, userId))

  if (existingUser) {
    // Update existing user
    await db.update(users).set({ openaiApiKey: encryptedKey }).where(eq(users.id, userId))
  } else {
    // Create new user record for OAuth user
    await db.insert(users).values({
      id: userId,
      email: userEmail,
      name: userName,
      image: userImage,
      emailVerified: new Date(),
      openaiApiKey: encryptedKey,
      subscriptionTier: "basic",
      subscriptionStatus: "active",
    })
  }
}

/**
 * Get user's OpenAI API key (decrypted)
 */
export async function getOpenAIKey(userId: string): Promise<GetOpenAIKeyResult> {
  const [user] = await db
    .select({ openaiApiKey: users.openaiApiKey })
    .from(users)
    .where(eq(users.id, userId))

  if (!user?.openaiApiKey) {
    return { hasKey: false }
  }

  try {
    const decryptedKey = decryptToken(user.openaiApiKey)
    return {
      hasKey: true,
      apiKey: decryptedKey,
    }
  } catch (error) {
    console.error("Failed to decrypt OpenAI API key:", error)
    throw new Error("Failed to decrypt API key")
  }
}

/**
 * Delete user's OpenAI API key
 */
export async function deleteOpenAIKey(userId: string): Promise<void> {
  await db.update(users).set({ openaiApiKey: null }).where(eq(users.id, userId))
}
