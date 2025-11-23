import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"

export const authConfig = {
  pages: {
    signIn: "/auth/login",
    newUser: "/auth/signup",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard")
      const isOnAuth = nextUrl.pathname.startsWith("/auth")

      if (isOnDashboard) {
        if (isLoggedIn) return true
        return false // Redirect unauthenticated users to login page
      } else if (isOnAuth) {
        if (isLoggedIn) return Response.redirect(new URL("/dashboard", nextUrl))
        return true
      }
      return true
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        // For OAuth users, these might not exist yet
        token.subscriptionTier = user.subscriptionTier || "basic"
        token.subscriptionStatus = user.subscriptionStatus || "active"
        
        // Store provider info
        if (account) {
          token.provider = account.provider
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.subscriptionTier = token.subscriptionTier as string
        session.user.subscriptionStatus = token.subscriptionStatus as string
      }
      return session
    },
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
  ],
} satisfies NextAuthConfig

