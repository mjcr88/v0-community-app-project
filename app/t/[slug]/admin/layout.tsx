import type React from "react"
import { redirect } from 'next/navigation'
import { createClient } from "@/lib/supabase/server"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Home, MapPin, Users, Building2, HeartHandshake, Lightbulb, Map, Calendar, Package, ClipboardList } from 'lucide-react'
import Link from "next/link"
import { UserAvatarMenu } from "@/components/user-avatar-menu"

export default async function TenantAdminLayout({
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

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("role, tenant_id, first_name, last_name, email, profile_picture_url")
    .eq("id", user.id)
    .maybeSingle()

  if (userError) {
    console.error("[v0] Error fetching user data:", userError)
    redirect(`/t/${slug}/login`)
  }

  const isSuperAdmin = userData?.role === "super_admin"

  const { data: tenant, error: tenantError } = await supabase.from("tenants").select("*").eq("slug", slug).single()

  if (tenantError || !tenant) {
    console.error("[v0] Error fetching tenant:", tenantError)
    redirect("/backoffice/login")
  }

  const isTenantAdminRole = userData?.role === "tenant_admin" && userData?.tenant_id === tenant.id

  let isTenantAdmin = false
  let residentData = null

  if (isSuperAdmin) {
    // Super admin can access any tenant
    const { data, error } = await supabase
      .from("users")
      .select(`
        id,
        first_name,
        last_name,
        email,
        profile_picture_url,
        is_tenant_admin,
        lot_id
      `)
      .eq("id", user.id)
      .maybeSingle()

    if (error) {
      console.error("[v0] Error fetching super admin data:", error)
      redirect(`/t/${slug}/login`)
    }

    residentData = data
    isTenantAdmin = true
  } else if (isTenantAdminRole) {
    isTenantAdmin = true
    residentData = {
      id: user.id,
      first_name: userData.first_name,
      last_name: userData.last_name,
      email: userData.email,
      profile_picture_url: userData.profile_picture_url,
    }
  } else {
    // Check if they're a resident with is_tenant_admin flag
    const { data, error } = await supabase
      .from("users")
      .select(`
        id,
        first_name,
        last_name,
        email,
        profile_picture_url,
        is_tenant_admin,
        lot_id,
        lots!inner (
          neighborhood_id,
          neighborhoods!inner (
            tenant_id
          )
        )
      `)
      .eq("id", user.id)
      .maybeSingle()

    if (error) {
      console.error("[v0] Error fetching resident data:", error)
      redirect(`/t/${slug}/login`)
    }

    residentData = data

    const residentTenantId = data?.lots?.neighborhoods?.tenant_id
    isTenantAdmin = data?.is_tenant_admin === true && residentTenantId === tenant.id

    if (!isTenantAdmin) {
      redirect(`/t/${slug}/login`)
    }
  }

  const defaultFeatures = {
    neighborhoods: true,
    interests: true,
    families: true,
    lots: true,
    map: true,
    events_enabled: false,
    requests_enabled: true,
  }

  const features = {
    ...defaultFeatures,
    ...(tenant?.features || {}),
    events_enabled: tenant?.events_enabled ?? false,
    requests_enabled: tenant?.requests_enabled ?? true,
  } as {
    neighborhoods?: boolean
    interests?: boolean
    families?: boolean
    lots?: boolean
    map?: boolean
    events_enabled?: boolean
    requests_enabled?: boolean
    location_types?: Record<string, boolean>
  }

  console.log("[v0] Tenant features from DB (layout):", tenant?.features)
  console.log("[v0] Merged features (layout):", features)
  console.log("[v0] Map feature enabled?", features.map)
  console.log("[v0] Events enabled?", features.events_enabled)
  console.log("[v0] Requests enabled?", features.requests_enabled)

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="border-b border-sidebar-border">
          <div className="px-2 py-2">
            <h2 className="text-lg font-semibold text-forest-900">{tenant.name}</h2>
            <p className="text-xs text-forest-600">
              {isSuperAdmin ? "Super Admin Access" : isTenantAdminRole ? "Tenant Admin" : "Community Admin"}
            </p>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Overview</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href={`/t/${slug}/admin/dashboard`}>
                      <Home />
                      <span>Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {features.map && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href={`/t/${slug}/admin/map`}>
                        <Map />
                        <span>Community Map</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {features.neighborhoods && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href={`/t/${slug}/admin/neighborhoods`}>
                        <MapPin />
                        <span>Neighborhoods</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {features.lots && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href={`/t/${slug}/admin/lots`}>
                        <Building2 />
                        <span>Lots</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href={`/t/${slug}/admin/residents`}>
                      <Users />
                      <span>Residents</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {features.families && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href={`/t/${slug}/admin/families`}>
                        <HeartHandshake />
                        <span>Families</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {features.interests && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href={`/t/${slug}/admin/interests`}>
                        <Lightbulb />
                        <span>Interests</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {features.events_enabled && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href={`/t/${slug}/admin/events`}>
                        <Calendar />
                        <span>Events</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href={`/t/${slug}/admin/exchange`}>
                      <Package />
                      <span>Exchange</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {features.requests_enabled && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href={`/t/${slug}/admin/requests`}>
                        <ClipboardList />
                        <span>Requests</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border p-2">
          <UserAvatarMenu
            user={{
              firstName: residentData?.first_name || null,
              lastName: residentData?.last_name || null,
              email: residentData?.email || user.email || "",
              profilePictureUrl: residentData?.profile_picture_url || null,
            }}
            tenantSlug={slug}
            showResidentView={true}
            showBackToSuperAdmin={isSuperAdmin}
            isSuperAdmin={isSuperAdmin}
          />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <h1 className="text-lg font-semibold">Community Administration</h1>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
