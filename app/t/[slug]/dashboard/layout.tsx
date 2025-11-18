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
import { Home, Users, Map, Calendar, Package, Bell, ClipboardList } from 'lucide-react'
import Link from "next/link"
import { UserAvatarMenu } from "@/components/user-avatar-menu"
import { NotificationBellButton } from "@/components/notifications/notification-bell-button"
import { NotificationPreviewPopover } from "@/components/notifications/notification-preview-popover"

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

  const isAdmin = resident?.is_tenant_admin === true || isTenantAdmin || isSuperAdmin

  const defaultFeatures = { map: true }
  const mergedFeatures = { ...defaultFeatures, ...(tenant?.features || {}) }
  const mapEnabled = mergedFeatures.map === true
  const eventsEnabled = tenant.events_enabled === true
  const exchangeEnabled = tenant.exchange_enabled === true
  const requestsEnabled = tenant.requests_enabled ?? true

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="border-b border-sidebar-border">
          <div className="px-2 py-2">
            <h2 className="text-lg font-semibold text-forest-900">{tenant.name}</h2>
            <p className="text-xs text-forest-600">Resident Portal</p>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href={`/t/${slug}/dashboard`}>
                      <Home />
                      <span>Home</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>Community</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href={`/t/${slug}/dashboard/neighbours`}>
                      <Users />
                      <span>Neighbours</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {mapEnabled && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href={`/t/${slug}/dashboard/community-map`}>
                        <Map />
                        <span>Community Map</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {eventsEnabled && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href={`/t/${slug}/dashboard/events`}>
                        <Calendar />
                        <span>Events</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {exchangeEnabled && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href={`/t/${slug}/dashboard/exchange`}>
                        <Package />
                        <span>Exchange</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {requestsEnabled && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href={`/t/${slug}/dashboard/requests`}>
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
              firstName: resident?.first_name,
              lastName: resident?.last_name,
              email: resident?.email,
              profilePictureUrl: resident?.profile_picture_url,
            }}
            tenantSlug={slug}
            showAdminView={isAdmin}
            showBackToSuperAdmin={isSuperAdmin}
            isSuperAdmin={isSuperAdmin}
          />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <h1 className="text-lg font-semibold">Dashboard</h1>
          <div className="ml-auto">
            <NotificationPreviewPopover tenantSlug={slug} tenantId={tenant.id} userId={user.id} />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
