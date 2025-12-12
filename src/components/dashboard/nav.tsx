"use client"

import { PendingAchievementsBadge } from "@/components/achievements-badges/pending-achievements-badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { signOut } from "next-auth/react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/github", label: "GitHub Scanner" },
  { href: "/dashboard/achievements", label: "Achievements" },
  { href: "/dashboard/resume", label: "Resume Builder" },
  // { href: "/dashboard/summary", label: "Summary" },
  // { href: "/dashboard/resume/compare", label: "Resume Compare" },
  // { href: "/dashboard/settings", label: "Settings" },
]

export function DashboardNav() {
  const pathname = usePathname()

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
        </div>
      </div>
      <Button variant="ghost" onClick={() => signOut()}>
        Sign out
      </Button>
    </nav>
  )
}
