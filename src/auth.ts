import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import { db } from "./lib/db"
import { users } from "./lib/db/schema"
import { eq } from "drizzle-orm"

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.AUTH_SECRET,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      // Allow OAuth sign-ins
      if (account?.provider === "google" || account?.provider === "github") {
        try {
          // Check if user exists in database
          const [existingUser] = await db.select().from(users).where(eq(users.email, user.email!))

          if (!existingUser) {
            // Create new user record for OAuth users
            console.log("[Auth] Creating new user record for:", user.email)
            await db.insert(users).values({
              email: user.email!,
              name: user.name || null,
              image: user.image || null,
              emailVerified: new Date(),
              subscriptionTier: "basic",
              subscriptionStatus: "active",
            })
            console.log("[Auth] User created successfully")
          } else {
            // Update existing user's OAuth info if needed
            console.log("[Auth] User already exists:", user.email)
            await db
              .update(users)
              .set({
                name: user.name || existingUser.name,
                image: user.image || existingUser.image,
                emailVerified: existingUser.emailVerified || new Date(),
              })
              .where(eq(users.id, existingUser.id))
          }
        } catch (error) {
          console.error("[Auth] Error creating/updating user:", error)
          return false
        }
        return true
      }
      // Allow credentials sign-in
      return true
    },
  },
})
