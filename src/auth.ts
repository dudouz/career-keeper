import NextAuth from "next-auth"
import { authConfig } from "./auth.config"

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.AUTH_SECRET,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ account }) {
      // Allow OAuth sign-ins
      if (account?.provider === "google" || account?.provider === "github") {
        return true
      }
      // Allow credentials sign-in
      return true
    },
  },
})

