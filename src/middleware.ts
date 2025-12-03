import { auth } from "@/auth"

export default auth(() => {
  // The authorized callback in auth.config.ts handles redirects
  // This middleware runs on every request matched by the config below
})

export const config = {
  // Match all routes except static files and api routes that don't need auth
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
