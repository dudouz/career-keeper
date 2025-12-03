import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings, Construction } from "lucide-react"

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Settings
        </h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Construction className="h-5 w-5" />
            <CardTitle>Coming Soon</CardTitle>
          </div>
          <CardDescription>Settings page will be implemented in Task #19</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This page will include profile management, email preferences, password change, account
            deletion, and subscription management.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
