import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

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
    .from('users')
    .select('role, tenant_id, is_tenant_admin')
    .eq('id', user.id)
    .maybeSingle()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!tenant) {
    redirect('/backoffice/login')
  }

  const isSuperAdmin = userData?.role === 'super_admin'
  const isTenantAdmin =
    (userData?.role === 'tenant_admin' && userData?.tenant_id === tenant.id) ||
    userData?.is_tenant_admin === true

  if (!isSuperAdmin && !isTenantAdmin) {
    redirect(`/t/${slug}/dashboard`)
  }

  // Check if announcements feature is enabled
  if (tenant.announcements_enabled === false) {
    redirect(`/t/${slug}/admin/dashboard`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-forest-900">Manage Announcements</h1>
        <p className="text-forest-600">Create and manage community announcements</p>
      </div>

      <div className="rounded-lg border border-forest-200 bg-white p-8 text-center">
        <p className="text-forest-600">Admin announcements interface is being set up...</p>
        <p className="mt-2 text-sm text-forest-500">Phase 2 implementation coming soon</p>
      </div>
    </div>
  )
}
