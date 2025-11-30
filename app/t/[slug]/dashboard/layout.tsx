import type React from "react"
import { redirect } from 'next/navigation'
import { createClient } from "@/lib/supabase/server"
import { DashboardLayoutClient } from "@/components/ecovilla/navigation/dashboard-layout-client"

export default async function ResidentDashboardLayout({
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

  const { data: userData } = await supabase.from("users").select("role, tenant_id").eq("id", user.id).maybeSingle()

  const { data: tenant } = await supabase.from("tenants").select("*").eq("slug", slug).single()

  if (!tenant) {
    redirect("/backoffice/login")
  }

  const isSuperAdmin = userData?.role === "super_admin"
  const isTenantAdmin = userData?.role === "tenant_admin" && userData?.tenant_id === tenant.id

  const { data: resident } = await supabase
    .from("users")
    .select(
      `
      id,
      first_name,
      last_name,
      email,
      profile_picture_url,
      is_tenant_admin,
      onboarding_completed,
      tenant_id,
      lot_id
    `,
    )
    .eq("id", user.id)
    .eq("tenant_id", tenant.id)
    .maybeSingle()

  if (!resident && !isTenantAdmin && !isSuperAdmin) {
    redirect(`/t/${slug}/login`)
  }

  // Mock data for badges (replace with real data fetching later)
  const userNavData = {
    name: resident?.first_name ? `${resident.first_name} ${resident.last_name}` : user.email || "User",
    avatarUrl: resident?.profile_picture_url,
    unreadAnnouncements: 2, // Example
    pendingRequests: 1, // Example
    unreadEvents: 0,
  }

  const { data: categories } = await supabase
    .from("exchange_categories")
    .select("id, name")
    .order("name")

  const { data: neighborhoods } = await supabase
    .from("neighborhoods")
    .select("id, name")
    .eq("tenant_id", tenant.id)
    .order("name")

  return (
    <DashboardLayoutClient
      slug={slug}
      tenantName={tenant.name}
      tenantLogoUrl={tenant.logo_url}
      user={userNavData}
      tenantId={tenant.id}
      categories={categories || []}
      neighborhoods={neighborhoods || []}
    >
      {children}
    </DashboardLayoutClient>
  )
}
