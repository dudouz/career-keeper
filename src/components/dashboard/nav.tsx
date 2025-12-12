"use client"

import { PendingAchievementsBadge } from "@/components/achievements-badges/pending-achievements-badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"
import { signOut } from "next-auth/react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/resume", label: "Resume Builder" },
  // { href: "/dashboard/summary", label: "Summary" },
  // { href: "/dashboard/resume/compare", label: "Resume Compare" },
  // { href: "/dashboard/settings", label: "Settings" },
]

const githubSubItems = [
  {
    href: "/dashboard/github",
    label: "GitHub Scanner",
  },
  {
    href: "/dashboard/agents",
    label: "AI Analysis",
  },
  {
    href: "/dashboard/achievements",
    label: "Achievements",
  },
]

export function DashboardNav() {
  const pathname = usePathname()
  const isGitHubSection =
    pathname.startsWith("/dashboard/github") ||
    pathname.startsWith("/dashboard/agents") ||
    pathname.startsWith("/dashboard/achievements")

  return (
    <nav className="flex items-center justify-between border-b bg-background px-6 py-4">
      <div className="flex items-center gap-8">
        <Link href="/dashboard" className="text-xl font-bold">
          Career Keeper
        </Link>
        <div className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <div key={item.href} className="flex items-center gap-2">
              <Link
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  pathname === item.href ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {item.label}
              </Link>
              {item.href === "/dashboard/achievements" && <PendingAchievementsBadge />}
            </div>
          ))}

          {/* GitHub Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary focus:outline-none",
                  isGitHubSection ? "text-foreground" : "text-muted-foreground"
                )}
              >
                GitHub
                <ChevronDown className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {githubSubItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex w-full items-center gap-2",
                        isActive && "bg-accent"
                      )}
                    >
                      <span className="font-medium">{item.label}</span>
                      {item.href === "/dashboard/achievements" && <PendingAchievementsBadge />}
                    </Link>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <Button variant="ghost" onClick={() => signOut()}>
        Sign out
      </Button>
    </nav>
  )
}
