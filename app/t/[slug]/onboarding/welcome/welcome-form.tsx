"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"

interface WelcomeFormProps {
  tenant: {
    id: string
    name: string
    slug: string
    features: any
  }
  resident: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string
  }
}

export function WelcomeForm({ tenant, resident }: WelcomeFormProps) {
  const router = useRouter()
  const displayName = [resident.first_name, resident.last_name].filter(Boolean).join(" ") || resident.email

  const handleContinue = () => {
    router.push(`/t/${tenant.slug}/onboarding/journey`)
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">Welcome, {displayName}!</CardTitle>
        <CardDescription>
          We're excited to have you join {tenant.name}. Let's take a few moments to set up your profile and help you
          connect with your community.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
              1
            </div>
            <div>
              <h3 className="font-medium">Complete Your Profile</h3>
              <p className="text-sm text-muted-foreground">Add your contact information and a profile picture</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
              2
            </div>
            <div>
              <h3 className="font-medium">Connect with Your Family</h3>
              <p className="text-sm text-muted-foreground">Link your family members or create a new family unit</p>
            </div>
          </div>

          {tenant.features?.interests && (
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                3
              </div>
              <div>
                <h3 className="font-medium">Share Your Interests</h3>
                <p className="text-sm text-muted-foreground">Let others know what you're passionate about</p>
              </div>
            </div>
          )}

          {tenant.features?.skills && (
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                {tenant.features?.interests ? "4" : "3"}
              </div>
              <div>
                <h3 className="font-medium">Share Your Skills</h3>
                <p className="text-sm text-muted-foreground">Offer your expertise to help neighbors</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button onClick={handleContinue} size="lg">
            Get Started
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
