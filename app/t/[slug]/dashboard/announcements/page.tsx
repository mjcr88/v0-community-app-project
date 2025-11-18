import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-forest-900">Announcements</h1>
        <p className="text-forest-600">View community announcements from your tenant admins</p>
      </div>

      <div className="rounded-lg border border-forest-200 bg-white p-8 text-center">
        <p className="text-forest-600">Announcements feature is being set up...</p>
        <p className="mt-2 text-sm text-forest-500">Phase 2 implementation coming soon</p>
      </div>
    </div>
  )
}
