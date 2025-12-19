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

export default async function OnboardingLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/t/${slug}/login`)
  }

  const { data: superAdmin } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle()

  const isSuperAdmin = superAdmin?.role === "super_admin"

  const { data: tenant } = await supabase.from("tenants").select("*").eq("slug", slug).single()

  if (!tenant) {
    redirect(`/t/${slug}/login`)
  }

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
    .in("role", ["resident", "tenant_admin"])
    .maybeSingle()

  if (!userRecord) {
    redirect(`/t/${slug}/login`)
  }

  // Users can now exit onboarding and return via "Complete Onboarding" button

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
