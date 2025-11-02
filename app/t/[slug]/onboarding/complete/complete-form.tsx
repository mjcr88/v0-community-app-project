"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Sparkles, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface CompleteFormProps {
  tenant: {
    id: string
    name: string
    slug: string
  }
  resident: {
    id: string
    first_name: string | null
    last_name: string | null
  }
  isSuperAdmin: boolean
}

export function CompleteForm({ tenant, resident, isSuperAdmin }: CompleteFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const displayName = [resident.first_name, resident.last_name].filter(Boolean).join(" ") || "there"

  const handleComplete = async () => {
    setIsLoading(true)

    try {
      if (isSuperAdmin) {
        console.log("[v0] Super admin test mode - skipping onboarding completion")
        window.location.href = `/t/${tenant.slug}/admin`
        return
      }

      const { error } = await supabase
        .from("users")
        .update({
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq("id", resident.id)

      if (error) {
        console.error("[v0] Error completing onboarding:", error)
        setIsLoading(false)
        return
      }

      console.log("[v0] Onboarding marked as complete for resident:", resident.id)

      window.location.href = `/t/${tenant.slug}/dashboard`
    } catch (error) {
      console.error("[v0] Error completing onboarding:", error)
      setIsLoading(false)
    }
  }

  const handleClose = async () => {
    setIsLoading(true)

    try {
      if (!isSuperAdmin) {
        const { error } = await supabase
          .from("users")
          .update({
            onboarding_completed: true,
            onboarding_completed_at: new Date().toISOString(),
          })
          .eq("id", resident.id)

        if (error) {
          console.error("[v0] Error completing onboarding:", error)
          setIsLoading(false)
          return
        }

        console.log("[v0] Onboarding marked as complete for resident:", resident.id)
      }

      window.location.href = `/t/${tenant.slug}/dashboard`
    } catch (error) {
      console.error("[v0] Error completing onboarding:", error)
      setIsLoading(false)
    }
  }

  return (
    <Card className="text-center">
      <CardHeader className="space-y-6 pb-8">
        <div className="mx-auto relative">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </div>
          <div className="absolute -top-2 -right-2">
            <Sparkles className="h-8 w-8 text-yellow-500 animate-pulse" />
          </div>
        </div>
        <div className="space-y-2">
          <CardTitle className="text-3xl">Welcome to {tenant.name}!</CardTitle>
          <CardDescription className="text-base">
            Congratulations, {displayName}! You've completed your profile setup.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-muted/50 rounded-lg p-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            You're now part of a vibrant community of neighbors who share your values and vision. Here's what you can do
            next:
          </p>
          <div className="space-y-3 text-left">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium">
                ✓
              </div>
              <div>
                <p className="text-sm font-medium">Explore your community</p>
                <p className="text-xs text-muted-foreground">Browse neighborhoods, lots, and amenities</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium">
                ✓
              </div>
              <div>
                <p className="text-sm font-medium">Connect with neighbors</p>
                <p className="text-xs text-muted-foreground">Find people who share your interests</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium">
                ✓
              </div>
              <div>
                <p className="text-sm font-medium">Update your profile anytime</p>
                <p className="text-xs text-muted-foreground">Keep your information current as your journey evolves</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button variant="outline" onClick={handleClose} disabled={isLoading} className="flex-1 bg-transparent">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Close
          </Button>
          <Button onClick={handleComplete} disabled={isLoading} className="flex-1">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Go to Dashboard
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
