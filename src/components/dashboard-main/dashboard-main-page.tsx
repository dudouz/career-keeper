import { auth } from "@/auth"
import { OnboardingCard } from "@/components/dashboard/onboarding"
import { SnapshotView } from "@/components/dashboard/snapshot-view"

export async function DashboardMainPage() {
  const session = await auth()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back, {session?.user?.name || session?.user?.email}!
        </h1>
        <p className="text-muted-foreground">
          {session?.user?.name || session?.user?.email ? "Manage your career profile" : "Get started"}
        </p>
      </div>

      {/* Show Snapshot OR Onboarding - one or the other */}
      <div className="space-y-6">
        <SnapshotView />
        <OnboardingCard />
      </div>
    </div>
  )
}
