import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { decryptToken } from "@/lib/github/encryption";
import { eq } from "drizzle-orm";

/**
 * Helper: Get user's OpenAI API key from database (decrypted)
 * Shared across all pipeline steps to ensure they always have the latest key
 */
export async function getUserOpenAIKey(userId: string): Promise<string> {
  const [user] = await db
    .select({ openaiApiKey: users.openaiApiKey })
    .from(users)
    .where(eq(users.id, userId));

  if (!user?.openaiApiKey) {
    throw new Error("OpenAI API key not found. Please add it in settings.");
  }

  try {
    const decryptedKey = decryptToken(user.openaiApiKey);
    
    // Validate the decrypted key
    if (!decryptedKey || typeof decryptedKey !== 'string' || decryptedKey.trim().length === 0) {
      throw new Error("Decrypted API key is invalid");
    }
    
    return decryptedKey.trim();
  } catch (error) {
    console.error("Failed to decrypt OpenAI API key:", error);
    throw new Error(
      "Failed to decrypt API key. Please re-configure your OpenAI API key."
    );
  }
}

