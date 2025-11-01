import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { OnboardingStepHeader } from "@/components/onboarding-step-header"

const ONBOARDING_STEPS = [
  { path: "welcome", title: "Welcome", description: "Get started with your community" },
  { path: "profile", title: "Basic Information", description: "Tell us about yourself" },
  { path: "journey", title: "Your Journey", description: "Share your timeline and goals" },
  { path: "interests", title: "Interests", description: "Share what you're passionate about" },
  { path: "skills", title: "Skills", description: "Offer your expertise to neighbors" },
  { path: "family", title: "Family", description: "Map your family relationships" },
  { path: "complete", title: "Review & Complete", description: "Confirm your information" },
]

function getCurrentStep(pathname: string): number {
  const pathParts = pathname.split("/")
  const currentPath = pathParts[pathParts.length - 1]
  const stepIndex = ONBOARDING_STEPS.findIndex((step) => step.path === currentPath)
  return stepIndex >= 0 ? stepIndex + 1 : 1
}

function getStepInfo(pathname: string) {
  const stepIndex = getCurrentStep(pathname) - 1
  return ONBOARDING_STEPS[stepIndex] || ONBOARDING_STEPS[0]
}

export default async function OnboardingLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/t/${slug}/login`)
  }

  // Check if super admin
  const { data: superAdmin } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle()

  const isSuperAdmin = superAdmin?.role === "super_admin"

  // Get tenant info
  const { data: tenant } = await supabase.from("tenants").select("*").eq("slug", slug).single()

  if (!tenant) {
    redirect(`/t/${slug}/login`)
  }

  // For now, we'll pass step 1 as default since we can't access pathname in server component
  const currentStep = 1
  const totalSteps = ONBOARDING_STEPS.length

  if (isSuperAdmin) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <OnboardingStepHeader tenantName={tenant.name} tenantSlug={slug} isTestMode showCloseButton />
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </div>
    )
  }

  const { data: userRecord } = await supabase
    .from("users")
    .select("*, tenants:tenant_id(id, name, slug, features)")
    .eq("id", user.id)
    .eq("role", "resident")
    .maybeSingle()

  if (!userRecord) {
    redirect(`/t/${slug}/login`)
  }

  if (userRecord.onboarding_completed) {
    redirect(`/t/${slug}/dashboard`)
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <OnboardingStepHeader tenantName={userRecord.tenants.name} tenantSlug={slug} showCloseButton />
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  )
}
