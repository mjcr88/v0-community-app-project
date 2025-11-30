import { createClient } from "@/lib/supabase/server"
import { redirect } from 'next/navigation'
import { NotificationPageClient } from "@/components/notifications/notification-page-client"
import { getNotifications } from "@/app/actions/notifications"

export default async function NotificationsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/t/${slug}/login`)
  }

  const { data: tenant } = await supabase.from("tenants").select("*").eq("slug", slug).single()

  if (!tenant) {
    redirect("/backoffice/login")
  }

  const { data: userData } = await supabase
    .from("users")
    .select("id, tenant_id")
    .eq("id", user.id)
    .eq("tenant_id", tenant.id)
    .single()

  if (!userData) {
    redirect(`/t/${slug}/login`)
  }

  // Fetch initial notifications (will be refetched client-side with SWR)
  const initialNotifications = await getNotifications(tenant.id)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Notifications</h2>
        <p className="text-muted-foreground">Stay updated on your community activity</p>
      </div>

      <NotificationPageClient
        tenantSlug={slug}
        tenantId={tenant.id}
        userId={user.id}
        initialNotifications={initialNotifications}
      />
    </div>
  )
}
