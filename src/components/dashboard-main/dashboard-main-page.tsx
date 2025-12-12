import { auth } from "@/auth"
import { OnboardingCard } from "@/components/dashboard/onboarding"
import { UserProfile } from "@/components/dashboard/user-profile"
import { StatsCard } from "@/components/dashboard/stats-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  BarChart3,
  FileText,
  Sparkles,
  Target,
  Link as LinkIcon,
  Upload,
  FileCheck,
  Settings,
  Check,
} from "lucide-react"

export async function DashboardMainPage() {
  const session = await auth()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back, {session?.user?.name || session?.user?.email}!
        </h1>
        <p className="text-muted-foreground">
          Here's your resume building progress
        </p>
      </div>

      <OnboardingCard />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="GitHub Scans"
          value="0"
          description="Scans this month"
          icon={BarChart3}
        />
        <StatsCard
          title="Resumes"
          value="0"
          description="Total resumes"
          icon={FileText}
        />
        <StatsCard
          title="Achievements"
          value="0"
          description="Tracked contributions"
          icon={Sparkles}
        />
        <StatsCard
          title="Subscription"
          value={session?.user?.subscriptionTier === "premium" ? "Premium" : "Basic"}
          description={
            session?.user?.subscriptionTier === "basic"
              ? "Upgrade for more features"
              : "All features unlocked"
          }
          icon={Target}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Get started with these common tasks</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Link href="/dashboard/github">
                <Button variant="outline" className="w-full justify-start h-auto py-4 gap-3">
                  <LinkIcon className="h-5 w-5 shrink-0" />
                  <div className="text-left">
                    <div className="font-semibold">Scan GitHub</div>
                    <div className="text-xs text-muted-foreground">
                      Analyze your contributions
                    </div>
                  </div>
                </Button>
              </Link>
              <Link href="/dashboard/resume">
                <Button variant="outline" className="w-full justify-start h-auto py-4 gap-3">
                  <Upload className="h-5 w-5 shrink-0" />
                  <div className="text-left">
                    <div className="font-semibold">Upload Resume</div>
                    <div className="text-xs text-muted-foreground">
                      Import existing resume
                    </div>
                  </div>
                </Button>
              </Link>
              <Link href="/dashboard/achievements">
                <Button variant="outline" className="w-full justify-start h-auto py-4 gap-3">
                  <FileCheck className="h-5 w-5 shrink-0" />
                  <div className="text-left">
                    <div className="font-semibold">View Achievements</div>
                    <div className="text-xs text-muted-foreground">
                      See your achievements
                    </div>
                  </div>
                </Button>
              </Link>
              <Link href="/dashboard/settings">
                <Button variant="outline" className="w-full justify-start h-auto py-4 gap-3">
                  <Settings className="h-5 w-5 shrink-0" />
                  <div className="text-left">
                    <div className="font-semibold">Settings</div>
                    <div className="text-xs text-muted-foreground">
                      Manage your account
                    </div>
                  </div>
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest actions and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <p>No recent activity yet</p>
                <p className="text-sm mt-1">Start by connecting your GitHub account</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <UserProfile />

          {session?.user?.subscriptionTier === "basic" && (
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="text-lg">Upgrade to Premium</CardTitle>
                <CardDescription>
                  Unlock advanced features and unlimited scans
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 mt-0.5 text-primary" />
                    <span>Unlimited GitHub scans</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 mt-0.5 text-primary" />
                    <span>Rich text editor</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 mt-0.5 text-primary" />
                    <span>Version control</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 mt-0.5 text-primary" />
                    <span>LinkedIn integration</span>
                  </li>
                </ul>
                <Button className="w-full" asChild>
                  <Link href="/dashboard/settings#billing">Upgrade Now</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
