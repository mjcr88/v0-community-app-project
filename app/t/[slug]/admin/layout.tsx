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
import { Home, MapPin, Users, Building2, LogOut, HeartHandshake, Lightbulb } from "lucide-react"
import Link from "next/link"

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
  if (!isSuperAdmin) {
    const { data: residentData } = await supabase
      .from("residents")
      .select(`
        id,
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

    // Check if resident belongs to this tenant and is an admin
    const residentTenantId = residentData?.lots?.neighborhoods?.tenant_id
    isTenantAdmin = residentData?.is_admin === true && residentTenantId === tenant.id

    if (!isTenantAdmin) {
      redirect(`/t/${slug}/login`)
    }
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
        <SidebarFooter className="border-t border-sidebar-border">
          <SidebarMenu>
            {isSuperAdmin && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/backoffice/dashboard">
                    <LogOut className="rotate-180" />
                    <span>Back to Super Admin</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">Community Administration</h1>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
