"use client"

import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function UserProfile() {
  const { data: session } = useSession()

  if (!session?.user) return null

  const isBasic = session.user.subscriptionTier === "basic"

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm text-muted-foreground">Email</p>
          <p className="font-medium">{session.user.email}</p>
        </div>
        {session.user.name && (
          <div>
            <p className="text-sm text-muted-foreground">Name</p>
            <p className="font-medium">{session.user.name}</p>
          </div>
        )}
        <div>
          <p className="text-sm text-muted-foreground">Subscription</p>
          <div className="mt-1">
            <Badge variant={isBasic ? "secondary" : "default"}>
              {isBasic ? "Basic" : "Premium"}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

