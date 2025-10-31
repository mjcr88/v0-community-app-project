import type React from "react"
import { redirect } from "next/navigation"
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
import { Home, MapPin, Users, Building2, HeartHandshake, Lightbulb } from "lucide-react"
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

  const { data: superAdminData } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle()

  const isSuperAdmin = superAdminData?.role === "super_admin"

  // Get tenant info
  const { data: tenant } = await supabase.from("tenants").select("*").eq("slug", slug).single()

  if (!tenant) {
    redirect("/backoffice/login")
  }

  let isTenantAdmin = false
  let residentData = null
  if (!isSuperAdmin) {
    const { data } = await supabase
      .from("residents")
      .select(`
        id,
        first_name,
        last_name,
        email,
        profile_picture_url,
        is_admin,
        lot_id,
        lots!inner (
          neighborhood_id,
          neighborhoods!inner (
            tenant_id
          )
        )
      `)
      .eq("auth_user_id", user.id)
      .maybeSingle()

    residentData = data

    // Check if resident belongs to this tenant and is an admin
    const residentTenantId = data?.lots?.neighborhoods?.tenant_id
    isTenantAdmin = data?.is_admin === true && residentTenantId === tenant.id

    if (!isTenantAdmin) {
      redirect(`/t/${slug}/login`)
    }
  } else {
    const { data } = await supabase
      .from("residents")
      .select(`
        id,
        first_name,
        last_name,
        email,
        profile_picture_url,
        is_admin,
        lot_id,
        lots (
          neighborhood_id,
          neighborhoods (
            tenant_id
          )
        )
      `)
      .eq("auth_user_id", user.id)
      .eq("lots.neighborhoods.tenant_id", tenant.id)
      .maybeSingle()

    residentData = data
  }

  const features = (tenant?.features as Record<string, boolean>) || {
    neighborhoods: true,
    interests: true,
    families: true,
    lots: true,
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="border-b border-sidebar-border">
          <div className="px-2 py-2">
            <h2 className="text-lg font-semibold text-forest-900">{tenant.name}</h2>
            <p className="text-xs text-forest-600">{isSuperAdmin ? "Super Admin Access" : "Community Admin"}</p>
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
