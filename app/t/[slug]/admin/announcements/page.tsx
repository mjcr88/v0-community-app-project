import { redirect } from 'next/navigation'
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Plus, Megaphone } from 'lucide-react'
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminAnnouncementsTable } from "./admin-announcements-table"

export default async function AdminAnnouncementsPage({
  params,
}: {
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

  const { data: userData } = await supabase
    .from("users")
    .select("role, tenant_id, is_tenant_admin")
    .eq("id", user.id)
    .maybeSingle()

  const { data: tenant } = await supabase.from("tenants").select("*").eq("slug", slug).single()

  if (!tenant) {
    redirect("/backoffice/login")
  }

  const isSuperAdmin = userData?.role === "super_admin"
  const isTenantAdmin =
    (userData?.role === "tenant_admin" && userData?.tenant_id === tenant.id) || userData?.is_tenant_admin === true

  if (!isSuperAdmin && !isTenantAdmin) {
    redirect(`/t/${slug}/dashboard`)
  }

  // Check if announcements feature is enabled
  if (tenant.announcements_enabled === false) {
    redirect(`/t/${slug}/admin/dashboard`)
  }

  const { data: announcements, error } = await supabase
    .from("announcements")
    .select(
      `
      *,
      creator:users!created_by (
        id,
        first_name,
        last_name,
        profile_picture_url
      )
    `
    )
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching announcements:", error)
  }

  const announcementIds = announcements?.map((a) => a.id) || []
  const { data: neighborhoodCounts } = await supabase
    .from("announcement_neighborhoods")
    .select("announcement_id")
    .in("announcement_id", announcementIds)

  // Calculate counts per announcement
  const neighborhoodCountMap = neighborhoodCounts?.reduce(
    (acc, item) => {
      acc[item.announcement_id] = (acc[item.announcement_id] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  ) || {}

  // Enrich announcements with neighborhood count
  const enrichedAnnouncements = announcements?.map((announcement) => ({
    ...announcement,
    neighborhood_count: neighborhoodCountMap[announcement.id] || 0,
  }))

  const publishedAnnouncements = enrichedAnnouncements?.filter((a) => a.status === "published") || []
  const archivedAnnouncements = enrichedAnnouncements?.filter((a) => a.status === "archived") || []
  const draftAnnouncements = enrichedAnnouncements?.filter((a) => a.status === "draft") || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Announcements</h2>
          <p className="text-muted-foreground">Create and manage community announcements</p>
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
            Published
            {publishedAnnouncements.length > 0 && (
              <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs">
                {publishedAnnouncements.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="archived">
            Archived
            {archivedAnnouncements.length > 0 && (
              <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs">
                {archivedAnnouncements.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="drafts">
            Drafts
            {draftAnnouncements.length > 0 && (
              <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs">{draftAnnouncements.length}</span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="published">
          {publishedAnnouncements.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
              <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No published announcements</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first announcement to notify residents
              </p>
              <Button asChild>
                <Link href={`/t/${slug}/admin/announcements/create`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Announcement
                </Link>
              </Button>
            </div>
          ) : (
            <AdminAnnouncementsTable announcements={publishedAnnouncements} slug={slug} tenantId={tenant.id} />
          )}
        </TabsContent>

        <TabsContent value="archived">
          {archivedAnnouncements.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
              <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No archived announcements</h3>
              <p className="text-sm text-muted-foreground">Archived announcements will appear here</p>
            </div>
          ) : (
            <AdminAnnouncementsTable announcements={archivedAnnouncements} slug={slug} tenantId={tenant.id} />
          )}
        </TabsContent>

        <TabsContent value="drafts">
          {draftAnnouncements.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
              <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No draft announcements</h3>
              <p className="text-sm text-muted-foreground">Draft announcements will appear here</p>
            </div>
          ) : (
            <AdminAnnouncementsTable announcements={draftAnnouncements} slug={slug} tenantId={tenant.id} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
