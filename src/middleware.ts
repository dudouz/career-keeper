import { auth } from "@/auth"

export default auth((_req) => {
  // Add any custom middleware logic here if needed
})

export const config = {
  // Match all routes except static files and api routes that don't need auth
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}

