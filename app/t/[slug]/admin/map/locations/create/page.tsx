import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { MapEditor } from "@/components/map/map-editor"

export default async function CreateLocationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createServerClient()

  console.log("[v0] Create location page - slug:", slug)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log("[v0] Create location page - user:", user?.id)

  if (!user) {
    console.log("[v0] No user, redirecting to login")
    redirect(`/t/${slug}/login`)
  }

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("role, tenant_id, is_tenant_admin")
    .eq("id", user.id)
    .single()

  console.log("[v0] User data:", userData)
  console.log("[v0] User error:", userError)

  if (!userData || (!userData.is_tenant_admin && userData.role !== "super_admin")) {
    console.log("[v0] Not admin, redirecting. is_tenant_admin:", userData?.is_tenant_admin, "role:", userData?.role)
    redirect(`/t/${slug}`)
  }

  const { data: tenant, error: tenantError } = await supabase.from("tenants").select("*").eq("slug", slug).single()

  console.log("[v0] Tenant data:", tenant)
  console.log("[v0] Tenant error:", tenantError)

  if (!tenant || (userData.role !== "super_admin" && tenant.id !== userData.tenant_id)) {
    console.log("[v0] Wrong tenant, redirecting. tenant.id:", tenant?.id, "userData.tenant_id:", userData.tenant_id)
    redirect(`/t/${slug}`)
  }

  console.log("[v0] All checks passed, rendering MapEditor")

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
