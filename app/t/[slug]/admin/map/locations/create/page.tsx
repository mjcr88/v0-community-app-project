import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { GoogleMapEditorClientWrapper } from "@/components/map/google-map-editor-client"

export default async function CreateLocationPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ preview?: string }>
}) {
  const { slug } = await params
  const { preview } = await searchParams

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

  if (!userData || (!userData.is_tenant_admin && userData.role !== "super_admin" && userData.role !== "tenant_admin")) {
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

  console.log("[v0] All checks passed, rendering GoogleMapEditor")

  const communityBoundary = tenant.map_boundary_coordinates || null

  const { data: lots } = await supabase
    .from("lots")
    .select("id, lot_number, address, neighborhood_id, neighborhoods(name)")
    .eq("neighborhoods.tenant_id", tenant.id)
    .order("lot_number")

  const { data: neighborhoods } = await supabase
    .from("neighborhoods")
    .select("id, name")
    .eq("tenant_id", tenant.id)
    .order("name")

  const isPreview = preview === "true"

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{isPreview ? "Preview GeoJSON Import" : "Add Location"}</h1>
        <p className="text-muted-foreground">
          {isPreview
            ? "Review the imported features and configure location settings"
            : "Draw a facility, lot boundary, or walking path on the map"}
        </p>
      </div>
      <GoogleMapEditorClientWrapper
        tenantSlug={slug}
        tenantId={tenant.id}
        communityBoundary={communityBoundary}
        lots={lots || []}
        neighborhoods={neighborhoods || []}
        isPreview={isPreview}
      />
    </div>
  )
}
