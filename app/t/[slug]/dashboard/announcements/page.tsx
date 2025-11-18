import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAnnouncements } from '@/app/actions/announcements'
import { AnnouncementsPageClient } from './announcements-page-client'

export default async function AnnouncementsPage({
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

  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!tenant) {
    redirect('/backoffice/login')
  }

  // Check if announcements feature is enabled
  if (tenant.announcements_enabled === false) {
    redirect(`/t/${slug}/dashboard`)
  }

  const result = await getAnnouncements(tenant.id, user.id)
  
  const announcements = result.success ? result.data : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Announcements</h1>
        <p className="text-muted-foreground">View community announcements from your tenant admins</p>
      </div>

      <AnnouncementsPageClient
        announcements={announcements}
        slug={slug}
        userId={user.id}
        tenantId={tenant.id}
      />
    </div>
  )
}
