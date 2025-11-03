import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { MapEditor } from "@/components/map/map-editor"

export default async function CreateLocationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/t/${slug}/login`)
  }

  const { data: profile } = await supabase.from("profiles").select("role, tenant_id").eq("id", user.id).single()

  if (!profile || profile.role !== "tenant_admin") {
    redirect(`/t/${slug}`)
  }

  const { data: tenant } = await supabase.from("tenants").select("*").eq("slug", slug).single()

  if (!tenant || tenant.id !== profile.tenant_id) {
    redirect(`/t/${slug}`)
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Add Location</h1>
        <p className="text-muted-foreground">Draw a facility, lot boundary, or walking path on the map</p>
      </div>
      <MapEditor tenantSlug={slug} tenantId={tenant.id} />
    </div>
  )
}
