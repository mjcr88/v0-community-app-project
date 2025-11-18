import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from "@/components/ui/button"
import { Plus, Megaphone } from 'lucide-react'
import Link from "next/link"
import { AdminAnnouncementsTable } from "./admin-announcements-table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function AdminAnnouncementsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  console.log("[v0] AdminAnnouncementsPage - Starting")
  
  const { slug } = await params
  console.log("[v0] Slug:", slug)
  
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log("[v0] User authenticated:", !!user)

  if (!user) {
    redirect(`/t/${slug}/login`)
  }

  const { data: userData } = await supabase
    .from('users')
    .select('role, tenant_id, is_tenant_admin')
    .eq('id', user.id)
    .maybeSingle()

  console.log("[v0] User data:", userData)

  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .single()

  console.log("[v0] Tenant:", tenant?.slug)

  if (!tenant) {
    redirect('/backoffice/login')
  }

  const isSuperAdmin = userData?.role === 'super_admin'
  const isTenantAdmin =
    (userData?.role === 'tenant_admin' && userData?.tenant_id === tenant.id) ||
    userData?.is_tenant_admin === true

  console.log("[v0] Is admin:", isSuperAdmin || isTenantAdmin)

  if (!isSuperAdmin && !isTenantAdmin) {
    redirect(`/t/${slug}/dashboard`)
  }

  // Check if announcements feature is enabled
  console.log("[v0] Announcements enabled:", tenant.announcements_enabled)
  
  if (tenant.announcements_enabled === false) {
    redirect(`/t/${slug}/admin/dashboard`)
  }

  console.log("[v0] Fetching announcements from database")

  const { data: announcements, error: announcementsError } = await supabase
    .from("announcements")
    .select(`
      *,
      users:created_by (
        id,
        first_name,
        last_name,
        email,
        profile_picture_url
      ),
      locations:location_id (
        id,
        name,
        type
      ),
      events:event_id (
        id,
        title
      )
    `)
    .eq("tenant_id", tenant.id)
    .neq("status", "deleted")
    .order("created_at", { ascending: false })

  if (announcementsError) {
    console.error("[v0] Error fetching announcements:", announcementsError)
    console.error("[v0] Error details:", JSON.stringify(announcementsError, null, 2))
  }

  console.log("[v0] Announcements fetched:", announcements?.length || 0)

  const publishedAnnouncements = announcements?.filter(
    (a) => a.status === "published"
  ) || []
  const archivedAnnouncements = announcements?.filter(
    (a) => a.status === "archived"
  ) || []
  const draftAnnouncements = announcements?.filter(
    (a) => a.status === "draft"
  ) || []

  console.log("[v0] Published:", publishedAnnouncements.length, "Archived:", archivedAnnouncements.length, "Drafts:", draftAnnouncements.length)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Announcements</h2>
          <p className="text-muted-foreground">
            Manage community-wide and neighborhood-specific announcements
          </p>
        </div>
        <Button asChild>
          <Link href={`/t/${slug}/admin/announcements/create`}>
            <Plus className="mr-2 h-4 w-4" />
            Create Announcement
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="published" className="space-y-4">
        <TabsList>
          <TabsTrigger value="published">
            Published ({publishedAnnouncements.length})
          </TabsTrigger>
          <TabsTrigger value="archived">
            Archived ({archivedAnnouncements.length})
          </TabsTrigger>
          <TabsTrigger value="drafts">
            Drafts ({draftAnnouncements.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="published" className="space-y-4">
          {publishedAnnouncements.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
              <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No published announcements</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get started by creating your first announcement
              </p>
              <Button asChild>
                <Link href={`/t/${slug}/admin/announcements/create`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Announcement
                </Link>
              </Button>
            </div>
          ) : (
            <AdminAnnouncementsTable
              announcements={publishedAnnouncements}
              slug={slug}
              tenantId={tenant.id}
            />
          )}
        </TabsContent>

        <TabsContent value="archived" className="space-y-4">
          {archivedAnnouncements.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
              <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No archived announcements</h3>
              <p className="text-sm text-muted-foreground">
                Archived announcements will appear here
              </p>
            </div>
          ) : (
            <AdminAnnouncementsTable
              announcements={archivedAnnouncements}
              slug={slug}
              tenantId={tenant.id}
            />
          )}
        </TabsContent>

        <TabsContent value="drafts" className="space-y-4">
          {draftAnnouncements.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
              <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No draft announcements</h3>
              <p className="text-sm text-muted-foreground">
                Draft announcements will appear here
              </p>
            </div>
          ) : (
            <AdminAnnouncementsTable
              announcements={draftAnnouncements}
              slug={slug}
              tenantId={tenant.id}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
