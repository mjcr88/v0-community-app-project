import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AnnouncementForm } from './announcement-form'

export default async function CreateAnnouncementPage({
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

  const { data: userData } = await supabase
    .from('users')
    .select('role, is_tenant_admin')
    .eq('id', user.id)
    .eq('tenant_id', tenant.id)
    .single()

  // Only tenant admins can create announcements
  if (
    !userData ||
    (!['tenant_admin', 'super_admin'].includes(userData.role) &&
      !userData.is_tenant_admin)
  ) {
    redirect(`/t/${slug}/admin`)
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create Announcement</h1>
        <p className="text-muted-foreground mt-2">
          Create a new announcement for your community
        </p>
      </div>

      <AnnouncementForm slug={slug} tenantId={tenant.id} />
    </div>
  )
}
